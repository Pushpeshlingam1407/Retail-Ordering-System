import api from './axios';
import type { AuthUser } from '../types';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  id: number;
  email: string;
  name: string;
  role: string;
  token?: string;
}

/**
 * Login with email and password
 * Tries backend API first, falls back to frontend auth if backend is unavailable
 */
export const loginUser = async (email: string, password: string): Promise<AuthUser> => {
  try {
    const response = await api.post<AuthResponse>('/api/auth/login', {
      email,
      password,
    });
    const { id, email: responseEmail, name, role } = response.data;
    return {
      id,
      email: responseEmail,
      name,
      role: role.toUpperCase() as any,
    };
  } catch (err) {
    // Fallback to frontend auth for demo/testing
    console.warn('Backend login failed, using frontend auth');
    return frontendLogin(email, password);
  }
};

/**
 * Sign up new user
 */
export const signupUser = async (name: string, email: string, password: string): Promise<AuthUser> => {
  try {
    const response = await api.post<AuthResponse>('/api/auth/signup', {
      name,
      email,
      password,
    });
    const { id, email: responseEmail, role } = response.data;
    return {
      id,
      email: responseEmail,
      name,
      role: role.toUpperCase() as any,
    };
  } catch (err) {
    // Fallback to frontend signup for demo/testing
    console.warn('Backend signup failed, using frontend signup');
    return frontendSignup(name, email, password);
  }
};

/**
 * Frontend-only auth (fallback) - hardcoded credentials
 */
const CREDENTIAL_STORE: Record<string, { id: number; password: string; role: string; name: string }> = {
  'admin@retailos.com': { id: 1, password: 'Admin@1234', role: 'ADMIN', name: 'Admin User' },
  'manager@retailos.com': { id: 2, password: 'Manager@99', role: 'ADMIN', name: 'Store Manager' },
  'user@retailos.com': { id: 3, password: 'User@1234', role: 'USER', name: 'Regular User' },
  'staff@retailos.com': { id: 4, password: 'Staff@5678', role: 'USER', name: 'Staff Member' },
};

const frontendLogin = async (email: string, password: string): Promise<AuthUser> => {
  // Simulate async network call
  await new Promise((r) => setTimeout(r, 150));

  const entry = CREDENTIAL_STORE[email.toLowerCase().trim()];
  if (!entry || entry.password !== password) {
    throw new Error('Invalid email or password.');
  }

  return {
    id: entry.id,
    email: email.toLowerCase().trim(),
    role: entry.role as any,
    name: entry.name,
  };
};

const frontendSignup = async (name: string, email: string, password: string): Promise<AuthUser> => {
  // Simulate async network call
  await new Promise((r) => setTimeout(r, 150));

  const normalizedEmail = email.toLowerCase().trim();
  if (CREDENTIAL_STORE[normalizedEmail]) {
    throw new Error('Email already registered.');
  }

  // In frontend-only mode, generate a new ID
  const newId = Math.max(...Object.values(CREDENTIAL_STORE).map((e) => e.id)) + 1;
  const newUser = { id: newId, password, role: 'USER', name };
  CREDENTIAL_STORE[normalizedEmail] = newUser;

  return {
    id: newId,
    email: normalizedEmail,
    role: 'USER',
    name,
  };
};
