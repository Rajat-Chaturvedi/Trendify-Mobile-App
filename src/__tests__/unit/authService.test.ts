// Unit tests for AuthService
// Requirements: 2.1, 2.2, 2.3, 2.4, 2.6

import { setSecureStore, type SecureStoreAdapter } from '../../storage/secureStore';
import {
  register,
  login,
  logout,
  restoreSession,
  storeToken,
  clearToken,
  setAuthApiAdapter,
  type AuthApiAdapter,
} from '../../services/authService';
import type { AuthToken } from '../../types/index';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function createMockSecureStore(): SecureStoreAdapter & { data: Record<string, string> } {
  const data: Record<string, string> = {};
  return {
    data,
    setItemAsync: async (key, value) => { data[key] = value; },
    getItemAsync: async (key) => data[key] ?? null,
    deleteItemAsync: async (key) => { delete data[key]; },
  };
}

function createMockApiAdapter(token = 'mock-token'): AuthApiAdapter {
  return {
    login: jest.fn().mockResolvedValue({ token }),
    register: jest.fn().mockResolvedValue({ token }),
  };
}

function createFailingApiAdapter(): AuthApiAdapter {
  return {
    login: jest.fn().mockRejectedValue(new Error('AUTH_FAILED')),
    register: jest.fn().mockRejectedValue(new Error('AUTH_FAILED')),
  };
}

const FORBIDDEN_WORDS = ['email', 'password', 'username'];

let mockStore: ReturnType<typeof createMockSecureStore>;

beforeEach(() => {
  mockStore = createMockSecureStore();
  setSecureStore(mockStore);
});

// ─── login ────────────────────────────────────────────────────────────────────

describe('login', () => {
  it('returns success with token on valid credentials', async () => {
    setAuthApiAdapter(createMockApiAdapter('tok-123'));
    const result = await login('user@example.com', 'secret');
    expect(result.success).toBe(true);
    expect(result.token?.accessToken).toBe('tok-123');
  });

  it('sets expiresAt ~24 hours from now', async () => {
    setAuthApiAdapter(createMockApiAdapter());
    const before = Date.now();
    const result = await login('user@example.com', 'secret');
    const after = Date.now();
    const expected = 24 * 60 * 60 * 1000;
    expect(result.token!.expiresAt).toBeGreaterThanOrEqual(before + expected);
    expect(result.token!.expiresAt).toBeLessThanOrEqual(after + expected);
  });

  it('persists token to SecureStore on success', async () => {
    setAuthApiAdapter(createMockApiAdapter('stored-tok'));
    await login('user@example.com', 'secret');
    expect(mockStore.data['auth_token']).toBeDefined();
    const stored = JSON.parse(mockStore.data['auth_token']);
    expect(stored.accessToken).toBe('stored-tok');
  });

  it('returns failure on invalid credentials', async () => {
    setAuthApiAdapter(createFailingApiAdapter());
    const result = await login('bad@example.com', 'wrong');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('error message does not reveal which field is wrong', async () => {
    setAuthApiAdapter(createFailingApiAdapter());
    const result = await login('bad@example.com', 'wrong');
    const errorLower = result.error!.toLowerCase();
    for (const word of FORBIDDEN_WORDS) {
      expect(errorLower).not.toContain(word);
    }
  });
});

// ─── register ─────────────────────────────────────────────────────────────────

describe('register', () => {
  it('returns success with token on valid registration', async () => {
    setAuthApiAdapter(createMockApiAdapter('reg-tok'));
    const result = await register('new@example.com', 'pass');
    expect(result.success).toBe(true);
    expect(result.token?.accessToken).toBe('reg-tok');
  });

  it('persists token to SecureStore on success', async () => {
    setAuthApiAdapter(createMockApiAdapter('reg-stored'));
    await register('new@example.com', 'pass');
    const stored = JSON.parse(mockStore.data['auth_token']);
    expect(stored.accessToken).toBe('reg-stored');
  });

  it('returns failure with generic error on API failure', async () => {
    setAuthApiAdapter(createFailingApiAdapter());
    const result = await register('bad@example.com', 'pass');
    expect(result.success).toBe(false);
    const errorLower = result.error!.toLowerCase();
    for (const word of FORBIDDEN_WORDS) {
      expect(errorLower).not.toContain(word);
    }
  });
});

// ─── logout ───────────────────────────────────────────────────────────────────

describe('logout', () => {
  it('clears the stored token', async () => {
    const token: AuthToken = { accessToken: 'abc', expiresAt: 9999999999 };
    mockStore.data['auth_token'] = JSON.stringify(token);
    await logout();
    expect(mockStore.data['auth_token']).toBeUndefined();
  });
});

// ─── restoreSession ───────────────────────────────────────────────────────────

describe('restoreSession', () => {
  it('returns null when no token is stored', async () => {
    const result = await restoreSession();
    expect(result).toBeNull();
  });

  it('returns the stored token when present', async () => {
    const token: AuthToken = { accessToken: 'restore-me', expiresAt: 9999999999 };
    mockStore.data['auth_token'] = JSON.stringify(token);
    const result = await restoreSession();
    expect(result).toEqual(token);
  });
});

// ─── storeToken / clearToken ──────────────────────────────────────────────────

describe('storeToken', () => {
  it('persists the token to SecureStore', async () => {
    const token: AuthToken = { accessToken: 'direct-store', expiresAt: 9999999999 };
    await storeToken(token);
    const stored = JSON.parse(mockStore.data['auth_token']);
    expect(stored.accessToken).toBe('direct-store');
  });
});

describe('clearToken', () => {
  it('removes the token from SecureStore', async () => {
    mockStore.data['auth_token'] = JSON.stringify({ accessToken: 'x', expiresAt: 1 });
    await clearToken();
    expect(mockStore.data['auth_token']).toBeUndefined();
  });
});
