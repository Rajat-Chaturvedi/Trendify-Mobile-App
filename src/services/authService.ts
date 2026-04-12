// Auth Service
// Requirements: 2.1, 2.2, 2.3, 2.4, 2.6

import type { AuthToken, AuthResult } from '../types/index';
import {
  storeToken as secureStoreToken,
  getToken,
  clearToken as secureStoreClearToken,
} from '../storage/secureStore';

// ─── API Adapter ──────────────────────────────────────────────────────────────

export interface AuthApiAdapter {
  login(email: string, password: string): Promise<{ token: string } | null>;
  register(email: string, password: string): Promise<{ token: string } | null>;
}

// Local mock adapter — accepts any valid email + password (min 6 chars).
// Replace with a real API adapter when a backend is available.
const defaultAdapter: AuthApiAdapter = {
  async login(email, password) {
    if (!email.includes('@') || password.length < 6) return null;
    // Generate a deterministic mock token from the email
    const token = `mock_${btoa(email)}_${Date.now()}`;
    return { token };
  },

  async register(email, password) {
    if (!email.includes('@') || password.length < 6) return null;
    const token = `mock_${btoa(email)}_${Date.now()}`;
    return { token };
  },
};

let _adapter: AuthApiAdapter = defaultAdapter;

export function setAuthApiAdapter(adapter: AuthApiAdapter): void {
  _adapter = adapter;
}

export function getAuthApiAdapter(): AuthApiAdapter {
  return _adapter;
}

// ─── Generic error message (must not reveal which field is wrong) ─────────────

const GENERIC_ERROR = 'Authentication failed. Please try again.';

// ─── AuthService ──────────────────────────────────────────────────────────────

export async function login(email: string, password: string): Promise<AuthResult> {
  try {
    const result = await _adapter.login(email, password);
    if (!result) return { success: false, error: GENERIC_ERROR };
    const token: AuthToken = { accessToken: result.token, expiresAt: Date.now() + 86400000 };
    await secureStoreToken(token);
    return { success: true, token };
  } catch {
    return { success: false, error: GENERIC_ERROR };
  }
}

export async function register(email: string, password: string): Promise<AuthResult> {
  try {
    const result = await _adapter.register(email, password);
    if (!result) return { success: false, error: GENERIC_ERROR };
    const token: AuthToken = { accessToken: result.token, expiresAt: Date.now() + 86400000 };
    await secureStoreToken(token);
    return { success: true, token };
  } catch {
    return { success: false, error: GENERIC_ERROR };
  }
}

export async function logout(): Promise<void> {
  await secureStoreClearToken();
}

export async function restoreSession(): Promise<AuthToken | null> {
  return getToken();
}

export async function storeToken(token: AuthToken): Promise<void> {
  await secureStoreToken(token);
}

export async function clearToken(): Promise<void> {
  await secureStoreClearToken();
}
