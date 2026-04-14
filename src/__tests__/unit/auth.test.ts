// Unit tests for AuthService (real API flow)
// Requirements: 2.1, 2.2, 2.3, 2.4, 2.6

import { login, register, logout, restoreSession } from '../../services/authService';
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

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

function mockAuthSuccess() {
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
      expiresIn: 3600,
      user: { id: 'user-1', email: 'test@example.com', displayName: 'Test User' },
    }),
  });
}

function mockAuthFailure() {
  mockFetch.mockResolvedValue({ ok: false, status: 401, statusText: 'Unauthorized' });
}

let mockStore: ReturnType<typeof createMockSecureStore>;

beforeEach(() => {
  mockStore = createMockSecureStore();
  setSecureStore(mockStore);
  mockFetch.mockReset();
});

// ─── login ────────────────────────────────────────────────────────────────────

describe('login', () => {
  it('returns success with token on valid credentials', async () => {
    mockAuthSuccess();
    const result = await login('user@example.com', 'pass123');
    expect(result.success).toBe(true);
    expect(result.token?.accessToken).toBe('test-access-token');
  });

  it('persists token to SecureStore on success', async () => {
    mockAuthSuccess();
    await login('user@example.com', 'pass123');
    expect(mockStore.data['auth_token']).toBeDefined();
    expect(JSON.parse(mockStore.data['auth_token']).accessToken).toBe('test-access-token');
  });

  it('stores refresh token on success', async () => {
    mockAuthSuccess();
    await login('user@example.com', 'pass123');
    expect(mockStore.data['refresh_token']).toBe('test-refresh-token');
  });

  it('returns failure with generic error on invalid credentials', async () => {
    mockAuthFailure();
    const result = await login('bad@example.com', 'wrong');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('error message does not contain field-specific words', async () => {
    mockAuthFailure();
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
    mockAuthSuccess();
    const result = await register('new@example.com', 'pass123');
    expect(result.success).toBe(true);
    expect(result.token?.accessToken).toBe('test-access-token');
  });

  it('returns failure when registration fails', async () => {
    mockAuthFailure();
    const result = await register('bad@example.com', 'pass');
    expect(result.success).toBe(false);
  });
});

// ─── restoreSession ───────────────────────────────────────────────────────────

describe('restoreSession', () => {
  it('returns null when no token is stored', async () => {
    expect(await restoreSession()).toBeNull();
  });

  it('returns the stored token after login', async () => {
    mockAuthSuccess();
    await login('user@example.com', 'pass123');
    const restored = await restoreSession();
    expect(restored?.accessToken).toBe('test-access-token');
  });
});

// ─── logout ───────────────────────────────────────────────────────────────────

describe('logout', () => {
  it('clears the stored token', async () => {
    mockAuthSuccess();
    await login('user@example.com', 'pass123');
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });
    await logout();
    expect(await restoreSession()).toBeNull();
  });

  it('does not throw when no token is stored', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });
    await expect(logout()).resolves.toBeUndefined();
  });
});
