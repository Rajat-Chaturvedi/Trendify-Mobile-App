// Unit tests for AuthService
// Requirements: 2.1, 2.2, 2.3, 2.4, 2.6

import {
  login,
  register,
  logout,
  restoreSession,
  setAuthApiAdapter,
  type AuthApiAdapter,
} from '../../services/authService';
import { setSecureStore, type SecureStoreAdapter } from '../../storage/secureStore';

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

function makeSuccessAdapter(token = 'test-token'): AuthApiAdapter {
  return {
    login: jest.fn(async () => ({ token })),
    register: jest.fn(async () => ({ token })),
  };
}

function makeFailAdapter(): AuthApiAdapter {
  return {
    login: jest.fn(async () => null),
    register: jest.fn(async () => null),
  };
}

let mockStore: ReturnType<typeof createMockSecureStore>;

beforeEach(() => {
  mockStore = createMockSecureStore();
  setSecureStore(mockStore);
});

// ─── login ────────────────────────────────────────────────────────────────────

describe('login', () => {
  it('returns success with token on valid credentials', async () => {
    setAuthApiAdapter(makeSuccessAdapter('abc123'));
    const result = await login('user@example.com', 'pass');
    expect(result.success).toBe(true);
    expect(result.token?.accessToken).toBe('abc123');
  });

  it('persists token to SecureStore on success', async () => {
    setAuthApiAdapter(makeSuccessAdapter('stored-token'));
    await login('user@example.com', 'pass');
    expect(mockStore.data['auth_token']).toBeDefined();
    expect(JSON.parse(mockStore.data['auth_token']).accessToken).toBe('stored-token');
  });

  it('returns failure with generic error on invalid credentials', async () => {
    setAuthApiAdapter(makeFailAdapter());
    const result = await login('bad@example.com', 'wrong');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('error message does not contain field-specific words', async () => {
    setAuthApiAdapter(makeFailAdapter());
    const result = await login('bad@example.com', 'wrong');
    const lower = (result.error ?? '').toLowerCase();
    expect(lower).not.toContain('email');
    expect(lower).not.toContain('password');
    expect(lower).not.toContain('username');
  });
});

// ─── register ─────────────────────────────────────────────────────────────────

describe('register', () => {
  it('returns success with token on valid registration', async () => {
    setAuthApiAdapter(makeSuccessAdapter('reg-token'));
    const result = await register('new@example.com', 'pass');
    expect(result.success).toBe(true);
    expect(result.token?.accessToken).toBe('reg-token');
  });

  it('returns failure with generic error when registration fails', async () => {
    setAuthApiAdapter(makeFailAdapter());
    const result = await register('bad@example.com', 'pass');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

// ─── restoreSession ───────────────────────────────────────────────────────────

describe('restoreSession', () => {
  it('returns null when no token is stored', async () => {
    expect(await restoreSession()).toBeNull();
  });

  it('returns the stored token after login', async () => {
    setAuthApiAdapter(makeSuccessAdapter('session-token'));
    await login('user@example.com', 'pass');
    const restored = await restoreSession();
    expect(restored?.accessToken).toBe('session-token');
  });
});

// ─── logout ───────────────────────────────────────────────────────────────────

describe('logout', () => {
  it('clears the stored token', async () => {
    setAuthApiAdapter(makeSuccessAdapter('to-clear'));
    await login('user@example.com', 'pass');
    await logout();
    expect(await restoreSession()).toBeNull();
  });

  it('does not throw when no token is stored', async () => {
    await expect(logout()).resolves.toBeUndefined();
  });
});
