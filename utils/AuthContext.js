import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';
import { encryptPassword } from './rsaEncrypt';

const API_BASE = 'https://climbing.ge/api';
const AUTH_TOKEN_KEY = '@auth_token';

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
      if (stored) {
        api.defaults.headers.common['Authorization'] = `Bearer ${stored}`;
        const res = await api.get(`${API_BASE}/auth_user`);
        setUser(res.data);
        setToken(stored);
      }
    } catch {
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
      delete api.defaults.headers.common['Authorization'];
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email, password) {
    const encrypted = encryptPassword(password);
    const res = await api.post(`${API_BASE}/login`, { email, password: encrypted });
    const { token: newToken, user: newUser } = res.data;
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, newToken);
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    setToken(newToken);
    setUser(newUser);
    return res.data;
  }

  async function logout() {
    try {
      await api.post(`${API_BASE}/logout`);
    } catch {}
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    delete api.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  }

  async function register(name, surname, email, password, passwordConfirmation) {
    const res = await api.post(`${API_BASE}/register`, {
      name,
      surname,
      email,
      password,
      password_confirmation: passwordConfirmation,
    });
    const { token: newToken, user: newUser } = res.data;
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, newToken);
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
