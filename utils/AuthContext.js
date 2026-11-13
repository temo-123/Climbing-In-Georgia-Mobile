import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { API_BASE_URL } from './api';
import { encryptPassword } from './rsaEncrypt';
import { withRecaptchaRetry } from './recaptcha';
import { clearQueue } from './ascentQueue';
import { onGateEvent, emitGateEvent } from './accountGate';

// Backend default (User::MIN_AGE) — only used until auth_user answers with min_age.
export const DEFAULT_MIN_AGE = 13;

const API_BASE = API_BASE_URL;
const AUTH_TOKEN_KEY = '@auth_token';
const AUTH_USER_CACHE_KEY = '@auth_user_cache';
// Pre-fills the login form after a session ends (LoginScreen).
export const LAST_LOGIN_EMAIL_KEY = '@last_login_email';

const AuthContext = createContext({
  user: null,
  token: null,
  isLoading: true,
  login: async () => {},
  loginWithToken: async () => {},
  logout: async () => {},
  deleteAccount: async () => {},
  register: async () => {},
  forgotPassword: async () => {},
  refreshUser: async () => {},
});

// The account states the backend gates writes on (see utils/accountGate.js).
// Age first, then e-mail — same precedence as the server.
export function accountStateOf(user) {
  const isUnderage = !!user?.is_underage;
  const isUnverified = !!user && !isUnderage && !user.email_verified_at;
  return {
    loggedIn: !!user,
    isUnderage,
    isUnverified,
    minAge: Number(user?.min_age) || DEFAULT_MIN_AGE,
    // Logged in and allowed to use account functions (comment, review, ascent,
    // follow, favourite, user panel). Unverified users keep the buttons — the
    // server refuses and the verify sheet explains why.
    canAct: !!user && !isUnderage,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const tokenRef = useRef(null);
  tokenRef.current = token;
  const checkingRef = useRef(false);

  useEffect(() => {
    restoreSession();
  }, []);

  // 401 on a request sent with our token → make sure it's really the session
  // (password login elsewhere revokes every older token) before dropping it.
  // Banned → the server already revoked the tokens.
  useEffect(() => onGateEvent(async (type) => {
    if (type === 'banned') {
      if (tokenRef.current) await clearSession();
      return;
    }
    if (type !== 'unauthorized' || !tokenRef.current || checkingRef.current) return;
    checkingRef.current = true;
    try {
      await api.get(`${API_BASE}/auth_user`, { skipAuthGate: true });
    } catch (err) {
      if (err?.response?.status === 401 && tokenRef.current) {
        await clearSession();
        emitGateEvent('session_expired');
      }
    } finally {
      checkingRef.current = false;
    }
  }), []);

  async function restoreSession() {
    try {
      const stored = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      if (!stored) return;

      api.defaults.headers.common['Authorization'] = `Bearer ${stored}`;
      tokenRef.current = stored;
      setToken(stored);

      // Show the last-known user immediately (e.g. so the offline ascent form
      // can auto-fill name/surname/email right away) while the token gets
      // verified in the background, rather than making every app launch wait
      // on a network round-trip just to redisplay the user's own name.
      try {
        const cachedUserRaw = await AsyncStorage.getItem(AUTH_USER_CACHE_KEY);
        if (cachedUserRaw) setUser(JSON.parse(cachedUserRaw));
      } catch {}

      try {
        const res = await api.get(`${API_BASE}/auth_user`, { skipAuthGate: true });
        setUser(res.data);
        emitGateEvent('session_restored', res.data);
        await AsyncStorage.setItem(AUTH_USER_CACHE_KEY, JSON.stringify(res.data));
      } catch (err) {
        // Only a genuine "this token is no longer valid" response should log
        // the user out. A network failure (offline at launch, timeout, a
        // flaky connection) must NOT destroy the session — that previously
        // logged a user out just for opening the app without signal,
        // silently wiping the exact user data offline ascent submission is
        // supposed to auto-fill from. Keep the cached token/user as-is here.
        // (403 is_banned is handled by the gate listener above.)
        if (err?.response?.status === 401) {
          await clearSession();
          emitGateEvent('session_expired');
        }
      }
    } catch {
      // AsyncStorage itself failed — nothing to restore from.
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email, password) {
    const encrypted = encryptPassword(password);
    const res = await withRecaptchaRetry('login', (recaptcha_token) =>
      api.post(`${API_BASE}/login`, { email, password: encrypted, recaptcha_token })
    );
    const { token: newToken, user: loginUser, is_underage } = res.data;
    // The login answer has is_underage but not the rest of auth_user
    // (min_age, use_offline_data_on_mobile…) — show it at once, then re-read.
    const newUser = { ...loginUser, is_underage: !!is_underage };
    await startSession(newToken, newUser);
    return { ...res.data, user: newUser };
  }

  async function startSession(newToken, newUser) {
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, newToken);
    await AsyncStorage.setItem(AUTH_USER_CACHE_KEY, JSON.stringify(newUser));
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    tokenRef.current = newToken;
    setToken(newToken);
    setUser(newUser);
    let full = newUser;
    try { full = await refreshUser(); } catch {}
    emitGateEvent('logged_in', full);
    return full;
  }

  // Used after a Google/Facebook login (SocialController::callback /
  // create_password only ever return a bare Sanctum token, never a user
  // object), so the user has to be fetched separately.
  async function loginWithToken(newToken) {
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    const res = await api.get(`${API_BASE}/auth_user`);
    return startSession(newToken, res.data);
  }

  async function clearSession() {
    try {
      const cached = JSON.parse((await AsyncStorage.getItem(AUTH_USER_CACHE_KEY)) || 'null');
      if (cached?.email) await AsyncStorage.setItem(LAST_LOGIN_EMAIL_KEY, cached.email);
    } catch {}
    await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, AUTH_USER_CACHE_KEY]);
    delete api.defaults.headers.common['Authorization'];
    tokenRef.current = null;
    setToken(null);
    setUser(null);
  }

  async function logout() {
    try {
      await api.post(`${API_BASE}/logout`);
    } catch {}
    await clearSession();
  }

  // Permanent. The backend revokes every token itself, so no /logout call
  // afterwards (it would just 401). Social-signup users have no real
  // password — send it only when one was typed.
  async function deleteAccount(password) {
    const body = { confirm: 'DELETE' };
    if (password) body.password = password;
    await api.post(`${API_BASE}/account/delete`, body);
    await clearQueue().catch(() => {});
    await clearSession();
  }

  // POST /register — birthday (YYYY-MM-DD) is required; country / city /
  // phone are optional (sent as null when empty). lang: 'us' | 'ka'.
  async function register({ name, surname, birthday, email, country, city, phoneNumber, password, passwordConfirmation, lang }) {
    const res = await withRecaptchaRetry('register', (recaptcha_token) =>
      api.post(`${API_BASE}/register`, {
        name,
        surname,
        birthday,
        email,
        password,
        password_confirmation: passwordConfirmation,
        lang,
        country: country || null,
        city: city || null,
        phone_number: phoneNumber || null,
        recaptcha_token,
      })
    );
    const { token: newToken, user: newUser } = res.data;
    // The register answer has no is_underage — startSession re-reads auth_user.
    await startSession(newToken, newUser);
    return res.data;
  }

  async function forgotPassword(email) {
    const res = await api.post(`${API_BASE}/password/send_forget_mail`, { email });
    return res.data;
  }

  // Re-fetches the authenticated user (e.g. after a profile/avatar edit) and
  // refreshes the cache used to instant-fill the UI on next launch.
  async function refreshUser() {
    const res = await api.get(`${API_BASE}/auth_user`);
    setUser(res.data);
    await AsyncStorage.setItem(AUTH_USER_CACHE_KEY, JSON.stringify(res.data));
    return res.data;
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, loginWithToken, logout, deleteAccount, register, forgotPassword, refreshUser, clearSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

// { loggedIn, isUnderage, isUnverified, minAge, canAct }
export function useAccount() {
  const { user } = useContext(AuthContext);
  return accountStateOf(user);
}
