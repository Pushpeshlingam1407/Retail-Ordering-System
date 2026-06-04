import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { AuthUser } from '../types';
import { loginUser, signupUser } from '../api/auth';
import type { SignupRequest } from '../api/auth';

const LS_KEY = 'retail_auth_v2';

function decodeJwtExp(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

function isTokenExpired(token?: string): boolean {
  if (!token) return false;
  const exp = decodeJwtExp(token);
  if (!exp) return false;
  return Date.now() > exp - 60_000; // 1 min buffer
}

function loadPersistedUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(LS_KEY) ?? sessionStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AuthUser>;
    if (
      typeof parsed.id !== 'number' ||
      typeof parsed.email !== 'string' ||
      typeof parsed.role !== 'string' ||
      typeof parsed.name !== 'string'
    ) return null;
    if (isTokenExpired(parsed.token)) {
      localStorage.removeItem(LS_KEY);
      sessionStorage.removeItem(LS_KEY);
      return null;
    }
    return parsed as AuthUser;
  } catch {
    return null;
  }
}

function persistUser(user: AuthUser) {
  const serialized = JSON.stringify(user);
  try { localStorage.setItem(LS_KEY, serialized); } catch { /* quota */ }
  try { sessionStorage.setItem(LS_KEY, serialized); } catch { /* quota */ }
  // backward-compat key for API axios interceptor
  try { sessionStorage.setItem('retail_auth_user', serialized); } catch { /* quota */ }
}

function clearUser() {
  localStorage.removeItem(LS_KEY);
  sessionStorage.removeItem(LS_KEY);
  sessionStorage.removeItem('retail_auth_user');
}

// ─── Context ──────────────────────────────────────────────────────────────────
interface AuthContextValue {
  user: AuthUser | null;
  login:  (email: string, password: string, expectedRole: 'USER' | 'ADMIN') => Promise<void>;
  signup: (payload: SignupRequest) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  refreshUser: (patch: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadPersistedUser);

  // Auto-logout when token expires
  useEffect(() => {
    if (!user?.token) return;
    const exp = decodeJwtExp(user.token);
    if (!exp) return;
    const remaining = exp - Date.now() - 60_000;
    if (remaining <= 0) { clearUser(); setUser(null); return; }
    const timer = window.setTimeout(() => { clearUser(); setUser(null); }, remaining);
    return () => clearTimeout(timer);
  }, [user?.token]);

  const login = useCallback(async (email: string, password: string, expectedRole: 'USER' | 'ADMIN') => {
    const authUser = await loginUser(email, password);
    if (authUser.role !== expectedRole) {
      if (expectedRole === 'ADMIN') {
        throw new Error('Access denied. You do not have administrator privileges.');
      } else {
        throw new Error('Administrators must log in through the Admin Portal.');
      }
    }
    persistUser(authUser);
    setUser(authUser);
  }, []);

  const signup = useCallback(async (payload: SignupRequest) => {
    const authUser = await signupUser(payload);
    persistUser(authUser);
    setUser(authUser);
  }, []);

  const logout = useCallback(() => {
    clearUser();
    setUser(null);
  }, []);

  const refreshUser = useCallback((patch: Partial<AuthUser>) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...patch };
      persistUser(updated);
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isAuthenticated: !!user, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
