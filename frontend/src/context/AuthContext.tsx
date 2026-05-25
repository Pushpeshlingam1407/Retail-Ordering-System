import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { AuthUser, UserRole } from '../types';

// ─── Hard-coded credential store (frontend-only, no backend touched) ───────────
// Format: email → { passwordHash, role, name }
// Passwords are compared in plain-text here since this is a pure frontend auth layer.
// In production you would call an auth API; per requirements we keep the backend untouched.
const CREDENTIAL_STORE: Record<string, { password: string; role: UserRole; name: string }> = {
  'admin@retailos.com':   { password: 'Admin@1234',  role: 'ADMIN', name: 'Admin User'  },
  'manager@retailos.com': { password: 'Manager@99',  role: 'ADMIN', name: 'Store Manager' },
  'user@retailos.com':    { password: 'User@1234',   role: 'USER',  name: 'Regular User' },
  'staff@retailos.com':   { password: 'Staff@5678',  role: 'USER',  name: 'Staff Member' },
};

const SESSION_KEY = 'retail_auth_user';

// ─── Context ──────────────────────────────────────────────────────────────────
interface AuthContextValue {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      return stored ? (JSON.parse(stored) as AuthUser) : null;
    } catch {
      return null;
    }
  });

  const login = useCallback(async (email: string, password: string) => {
    // Simulate async network call (150 ms)
    await new Promise(r => setTimeout(r, 150));

    const entry = CREDENTIAL_STORE[email.toLowerCase().trim()];
    if (!entry || entry.password !== password) {
      throw new Error('Invalid email or password.');
    }

    const authUser: AuthUser = { email: email.toLowerCase().trim(), role: entry.role, name: entry.name };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(authUser));
    setUser(authUser);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
