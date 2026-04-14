// Authenticated HTTP client
// Attaches Bearer token from AuthStore and handles token refresh on 401

import { useAuthStore } from '../stores/authStore';
import { API_V1 } from './config';

async function refreshTokens(): Promise<string | null> {
  try {
    const { getToken } = await import('../storage/secureStore');
    const stored = await getToken();
    if (!stored) return null;

    // We store refreshToken separately in SecureStore under 'refresh_token'
    const { getSecureStore } = await import('../storage/secureStore');
    const raw = await getSecureStore().getItemAsync('refresh_token');
    if (!raw) return null;

    const res = await fetch(`${API_V1}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: raw }),
    });
    if (!res.ok) return null;

    const data = (await res.json()) as { accessToken: string; refreshToken: string; expiresIn?: number };
    const token = {
      accessToken: data.accessToken,
      expiresAt: Date.now() + (data.expiresIn ?? 3600) * 1000,
    };
    useAuthStore.getState().setToken(token);
    await getSecureStore().setItemAsync('refresh_token', data.refreshToken);
    return data.accessToken;
  } catch {
    return null;
  }
}

export async function apiFetch(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<Response> {
  const token = useAuthStore.getState().token?.accessToken;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_V1}${path}`, { ...options, headers });

  if (res.status === 401 && retry) {
    const newToken = await refreshTokens();
    if (newToken) {
      return apiFetch(path, options, false);
    }
    useAuthStore.getState().clearAuth();
  }

  return res;
}
