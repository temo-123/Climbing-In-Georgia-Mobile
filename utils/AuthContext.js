import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { API_BASE_URL } from './api';
import { encryptPassword } from './rsaEncrypt';
import { withRecaptchaRetry } from './recaptcha';

const API_BASE = API_BASE_URL;
const AUTH_TOKEN_KEY = '@auth_token';
const AUTH_USER_CACHE_KEY = '@auth_user_cache';

const AuthContext = createContext({
  user: null,
  token: null,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
  register: async () => {},
  forgotPassword: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    restoreSession();
  }, []);

  async function restoreSession() {
    try {
      const stored = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      if (!stored) return;

      api.defaults.headers.common['Authorization'] = `Bearer ${stored}`;
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
        const res = await api.get(`${API_BASE}/auth_user`);
        setUser(res.data);
        await AsyncStorage.setItem(AUTH_USER_CACHE_KEY, JSON.stringify(res.data));
      } catch (err) {
        // Only a genuine "this token is no longer valid" response should log
        // the user out. A network failure (offline at launch, timeout, a
        // flaky connection) must NOT destroy the session — that previously
        // logged a user out just for opening the app without signal,
        // silently wiping the exact user data offline ascent submission is
        // supposed to auto-fill from. Keep the cached token/user as-is here.
        if (err?.response?.status === 401) {
          await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, AUTH_USER_CACHE_KEY]);
          delete api.defaults.headers.common['Authorization'];
          setToken(null);
          setUser(null);
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
    const { token: newToken, user: newUser } = res.data;
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, newToken);
    await AsyncStorage.setItem(AUTH_USER_CACHE_KEY, JSON.stringify(newUser));
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    setToken(newToken);
    setUser(newUser);
    return res.data;
  }

  async function logout() {
    try {
      await api.post(`${API_BASE}/logout`);
    } catch {}
    await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, AUTH_USER_CACHE_KEY]);
    delete api.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  }

  async function register(name, surname, email, country, city, phoneNumber, password, passwordConfirmation) {
    const res = await withRecaptchaRetry('register', (recaptcha_token) =>
      api.post(`${API_BASE}/register`, {
        name,
        surname,
        email,
        country,
        city,
        phone_number: phoneNumber,
        password,
        password_confirmation: passwordConfirmation,
        recaptcha_token,
      })
    );
    const { token: newToken, user: newUser } = res.data;
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, newToken);
    await AsyncStorage.setItem(AUTH_USER_CACHE_KEY, JSON.stringify(newUser));
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    setToken(newToken);
    setUser(newUser);
    return res.data;
  }

  async function forgotPassword(email) {
    const res = await api.post(`${API_BASE}/password/send_forget_mail`, { email });
    return res.data;
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, register, forgotPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
