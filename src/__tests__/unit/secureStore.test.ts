// Unit tests for SecureStore token helpers
// Requirements: 2.2, 2.6

import {
  setSecureStore,
  storeToken,
  getToken,
  clearToken,
  type SecureStoreAdapter,
} from '../../storage/secureStore';
import type { AuthToken } from '../../types/index';

// In-memory mock for SecureStoreAdapter
function createMockStore(): SecureStoreAdapter {
  const store: Record<string, string> = {};
  return {
    setItemAsync: async (key: string, value: string) => {
      store[key] = value;
    },
    getItemAsync: async (key: string) => store[key] ?? null,
    deleteItemAsync: async (key: string) => {
      delete store[key];
    },
  };
}

const VALID_TOKEN: AuthToken = {
  accessToken: 'eyJhbGciOiJIUzI1NiJ9.test',
  expiresAt: 9999999999, // far future unix timestamp
};

beforeEach(() => {
  setSecureStore(createMockStore());
});

// ─── storeToken / getToken ────────────────────────────────────────────────────

describe('storeToken + getToken', () => {
  it('returns null when no token has been stored', async () => {
    expect(await getToken()).toBeNull();
  });

  it('round-trips a valid token', async () => {
    await storeToken(VALID_TOKEN);
    expect(await getToken()).toEqual(VALID_TOKEN);
  });

  it('overwrites a previously stored token', async () => {
    const updated: AuthToken = { accessToken: 'new-token', expiresAt: 1111111111 };
    await storeToken(VALID_TOKEN);
    await storeToken(updated);
    expect(await getToken()).toEqual(updated);
  });
});

// ─── getToken — invalid data ──────────────────────────────────────────────────

describe('getToken with invalid stored data', () => {
  it('returns null for malformed JSON', async () => {
    setSecureStore({
      setItemAsync: async () => {},
      getItemAsync: async () => 'not-valid-json{{{',
      deleteItemAsync: async () => {},
    });
    expect(await getToken()).toBeNull();
  });

  it('returns null when stored object fails schema validation', async () => {
    setSecureStore({
      setItemAsync: async () => {},
      getItemAsync: async () => JSON.stringify({ accessToken: 123, expiresAt: -1 }),
      deleteItemAsync: async () => {},
    });
    expect(await getToken()).toBeNull();
  });

  it('returns null when stored object is missing required fields', async () => {
    setSecureStore({
      setItemAsync: async () => {},
      getItemAsync: async () => JSON.stringify({ accessToken: 'only-this' }),
      deleteItemAsync: async () => {},
    });
    expect(await getToken()).toBeNull();
  });
});

// ─── clearToken ───────────────────────────────────────────────────────────────

describe('clearToken', () => {
  it('removes a stored token', async () => {
    await storeToken(VALID_TOKEN);
    await clearToken();
    expect(await getToken()).toBeNull();
  });

  it('does not throw when no token is stored', async () => {
    await expect(clearToken()).resolves.toBeUndefined();
  });
});
