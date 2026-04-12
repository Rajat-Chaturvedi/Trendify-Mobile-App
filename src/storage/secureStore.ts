// SecureStore token helpers
// Requirements: 2.2, 2.6

import { AuthTokenSchema } from '../schemas/index';
import type { AuthToken } from '../types/index';

const TOKEN_KEY = 'auth_token';

// Minimal interface that expo-secure-store satisfies,
// making the module easy to mock in tests.
export interface SecureStoreAdapter {
  setItemAsync(key: string, value: string): Promise<void>;
  getItemAsync(key: string): Promise<string | null>;
  deleteItemAsync(key: string): Promise<void>;
}

// The store instance — lazily initialised so tests can inject a mock.
let _store: SecureStoreAdapter | null = null;

export function getSecureStore(): SecureStoreAdapter {
  if (!_store) {
    // Dynamically require so tests can mock the module before this runs.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    _store = require('expo-secure-store') as SecureStoreAdapter;
  }
  return _store;
}

/** Override the store instance (useful for testing). */
export function setSecureStore(store: SecureStoreAdapter): void {
  _store = store;
}

// ─── Token helpers ────────────────────────────────────────────────────────────

/** Serialises the token to JSON and persists it in SecureStore. */
export async function storeToken(token: AuthToken): Promise<void> {
  await getSecureStore().setItemAsync(TOKEN_KEY, JSON.stringify(token));
}

/**
 * Retrieves and validates the stored token.
 * Returns `null` if no token is stored or if the stored value is invalid.
 */
export async function getToken(): Promise<AuthToken | null> {
  const raw = await getSecureStore().getItemAsync(TOKEN_KEY);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    const result = AuthTokenSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

/** Removes the stored token from SecureStore. */
export async function clearToken(): Promise<void> {
  await getSecureStore().deleteItemAsync(TOKEN_KEY);
}
