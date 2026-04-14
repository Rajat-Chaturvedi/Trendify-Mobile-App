// Unit tests for AuthService (real API flow)
// Requirements: 2.1, 2.2, 2.3, 2.4, 2.6

import { setSecureStore, type SecureStoreAdapter } from '../../storage/secureStore';
import { login, register, logout, restoreSession, storeToken, clearToken } from '../../services/authService';
import type { AuthToken } from '../../types/index';

function createMockSecureStore(): SecureStoreAdapter & { data: Record<string, string> } {
  const data: Record<string, string> = {};
  return {
    data,
    setItemAsync: async (key, value) => { data[key] = value; },
    getItemAsync: async (key) => data[key] ?? null,
    deleteItemAsync: async (key) => { delete data[key]; },
  };
}

const mockFetch = jest.fn();
global.fetch = mockFetch;

function mockSuccess(token = 'tok-123') {
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({ accessToken: token, refreshToken: 'refresh-tok', expiresIn: 3600 }),
  });
}

function mockFailure() {
  mockFetch.mockResolvedValue({ ok: false, status: 401 });
}

let mockStore: ReturnType<typeof createMockSecureStore>;

beforeEach(() => {
  mockStore = createMockSecureStore();
  setSecureStore(mockStore);
  mockFetch.mockReset();
});

describe('login', () => {
  it('returns success with token', async () => {
    mockSuccess('abc');
    const result = await login('user@example.com', 'pass');
    expect(result.success).toBe(true);
    expect(result.token?.accessToken).toBe('abc');
  });

  it('persists token to SecureStore', async () => {
    mockSuccess('stored');
    await login('user@example.com', 'pass');
    expect(JSON.parse(mockStore.data['auth_token']).accessToken).toBe('stored');
  });

  it('returns failure on API error', async () => {
    mockFailure();
    const result = await login('bad@example.com', 'wrong');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('error message does not reveal field specifics', async () => {
    mockFailure();
    const result = await login('bad@example.com', 'wrong');
    const lower = (result.error ?? '').toLowerCase();
    expect(lower).not.toContain('email');
    expect(lower).not.toContain('password');
  });
});

describe('register', () => {
  it('returns success with token', async () => {
    mockSuccess('reg-tok');
    const result = await register('new@example.com', 'pass');
    expect(result.success).toBe(true);
    expect(result.token?.accessToken).toBe('reg-tok');
  });

  it('returns failure on API error', async () => {
    mockFailure();
    const result = await register('bad@example.com', 'pass');
    expect(result.success).toBe(false);
  });
});

describe('restoreSession', () => {
  it('returns null when nothing stored', async () => {
    expect(await restoreSession()).toBeNull();
  });

  it('returns stored token', async () => {
    const token: AuthToken = { accessToken: 'restore', expiresAt: 9999999999 };
    mockStore.data['auth_token'] = JSON.stringify(token);
    expect(await restoreSession()).toEqual(token);
  });
});

describe('logout', () => {
  it('clears stored token', async () => {
    mockStore.data['auth_token'] = JSON.stringify({ accessToken: 'x', expiresAt: 1 });
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });
    await logout();
    expect(mockStore.data['auth_token']).toBeUndefined();
  });
});

describe('storeToken / clearToken', () => {
  it('storeToken persists to SecureStore', async () => {
    const token: AuthToken = { accessToken: 'direct', expiresAt: 9999999999 };
    await storeToken(token);
    expect(JSON.parse(mockStore.data['auth_token']).accessToken).toBe('direct');
  });

  it('clearToken removes from SecureStore', async () => {
    mockStore.data['auth_token'] = JSON.stringify({ accessToken: 'x', expiresAt: 1 });
    await clearToken();
    expect(mockStore.data['auth_token']).toBeUndefined();
  });
});
