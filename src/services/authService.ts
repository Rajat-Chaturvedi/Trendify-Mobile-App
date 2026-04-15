// Auth Service — real API
// Requirements: 2.1, 2.2, 2.3, 2.4, 2.6

import type { AuthToken, AuthResult, UserProfile } from '../types/index';
import {
  storeToken as secureStoreToken,
  getToken,
  clearToken as secureStoreClearToken,
  getSecureStore,
} from '../storage/secureStore';
import { useAuthStore } from '../stores/authStore';
import { API_V1 } from '../api/config';

const GENERIC_ERROR = 'Authentication failed. Please try again.';

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
  // User may be nested under 'user' or returned flat at the top level
  user?: { id: string; email: string; displayName?: string; avatar?: string };
  id?: string;
  email?: string;
  displayName?: string;
  avatar?: string;
}

async function handleAuthResponse(data: AuthResponse): Promise<AuthResult> {
  const token: AuthToken = {
    accessToken: data.accessToken,
    expiresAt: Date.now() + (data.expiresIn ?? 3600) * 1000,
  };
  await secureStoreToken(token);
  // Store refresh token separately
  await getSecureStore().setItemAsync('refresh_token', data.refreshToken);

  // Support both nested { user: {...} } and flat { id, email, displayName } shapes.
  // Note: login/register responses may not include avatarUrl — we fetch the full
  // profile from /users/me afterwards to ensure avatar and all fields are present.
  const userSource = data.user ?? (data.id ? { id: data.id, email: data.email ?? '', displayName: data.displayName, avatar: data.avatar } : null);
  if (userSource) {
    const profile: UserProfile = {
      id: userSource.id,
      email: userSource.email,
      displayName: userSource.displayName ?? userSource.email,
      avatarUrl: userSource.avatar ?? null,
    };
    useAuthStore.setState({ token, user: profile, isAuthenticated: true });
  } else {
    useAuthStore.setState({ token, isAuthenticated: true });
  }

  // Always fetch the full profile so avatar and any other fields not in the
  // auth response are populated immediately (fire-and-forget, non-blocking).
  fetchAndSetProfile().catch(() => { /* ignore */ });

  return { success: true, token };
}

export async function login(email: string, password: string): Promise<AuthResult> {
  try {
    const res = await fetch(`${API_V1}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) return { success: false, error: GENERIC_ERROR };
    const data = (await res.json()) as AuthResponse;
    return handleAuthResponse(data);
  } catch {
    return { success: false, error: GENERIC_ERROR };
  }
}

export async function register(email: string, password: string): Promise<AuthResult> {
  try {
    const res = await fetch(`${API_V1}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) return { success: false, error: GENERIC_ERROR };
    const data = (await res.json()) as AuthResponse;
    return handleAuthResponse(data);
  } catch {
    return { success: false, error: GENERIC_ERROR };
  }
}

export async function logout(): Promise<void> {
  try {
    const token = useAuthStore.getState().token?.accessToken;
    if (token) {
      await fetch(`${API_V1}/auth/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
    }
  } catch { /* ignore */ }
  await secureStoreClearToken();
  await getSecureStore().deleteItemAsync('refresh_token');
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

// Fetch user profile from API and update store
export async function fetchAndSetProfile(): Promise<void> {
  try {
    const { apiFetch } = await import('../api/http');
    const res = await apiFetch('/users/me');
    if (!res.ok) return;
    // API returns `avatar` (base64 data URI) and optionally `avatarUrl`
    const data = (await res.json()) as { id: string; email: string; displayName?: string; avatarUrl?: string; avatar?: string };
    useAuthStore.setState({
      user: {
        id: data.id,
        email: data.email,
        displayName: data.displayName ?? data.email,
        avatarUrl: data.avatarUrl ?? data.avatar ?? null,
      },
    });
  } catch { /* ignore */ }
}

// Restore session and fetch profile atomically — used by biometric login
// Sets token + user in a single state update to avoid navigating before user is available
export async function restoreSessionWithProfile(token: AuthToken): Promise<boolean> {
  try {
    await secureStoreToken(token);
    // Temporarily store token so apiFetch can use it
    useAuthStore.setState({ token });
    const { apiFetch } = await import('../api/http');
    const res = await apiFetch('/users/me');
    if (res.ok) {
      // API returns `avatar` (base64 data URI) and optionally `avatarUrl`
      const data = (await res.json()) as { id: string; email: string; displayName?: string; avatarUrl?: string; avatar?: string };
      useAuthStore.setState({
        token,
        isAuthenticated: true,
        user: {
          id: data.id,
          email: data.email,
          displayName: data.displayName ?? data.email,
          avatarUrl: data.avatarUrl ?? data.avatar ?? null,
        },
      });
    } else {
      // Profile fetch failed — still authenticate with token, user will be null
      useAuthStore.setState({ token, isAuthenticated: true });
    }
    return true;
  } catch {
    return false;
  }
}
