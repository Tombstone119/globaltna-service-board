'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, TOKEN_KEY, USER_KEY, AUTH_EXPIRED_EVENT } from './api';

const AuthContext = createContext({
  user: null,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
});

function readStoredUser() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function persistSession(token, user) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {}
}

function clearSession() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
  } catch {}
}

export function AuthProvider({ children }) {
  const router = useRouter();
  const [user, setUser]           = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const stored = readStoredUser();
    const token = typeof window !== 'undefined' ? window.localStorage.getItem(TOKEN_KEY) : null;

    if (!token) {
      setIsLoading(false);
      return () => { cancelled = true; };
    }

    setUser(stored);
    api.auth.me()
      .then((res) => {
        if (cancelled) return;
        setUser(res.user);
        setIsLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        clearSession();
        setUser(null);
        setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    function handleExpired() {
      setUser(null);
      router.push('/login');
    }
    window.addEventListener(AUTH_EXPIRED_EVENT, handleExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleExpired);
  }, [router]);

  const login = useCallback(async ({ email, password }) => {
    const res = await api.auth.login({ email, password });
    persistSession(res.token, res.user);
    setUser(res.user);
    return res.user;
  }, []);

  const register = useCallback(async ({ email, password }) => {
    const res = await api.auth.register({ email, password });
    persistSession(res.token, res.user);
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
