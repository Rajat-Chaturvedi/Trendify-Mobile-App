// Unit tests for AuthStore
// Requirements: 2.2, 2.6

import { setSecureStore, type SecureStoreAdapter } from '../../storage/secureStore';
import { useAuthStore } from '../../stores/authStore';
import type { AuthToken, UserProfile } from '../../types/index';

function createMockStore(): SecureStoreAdapter & { data: Record<string, string> } {
  const data: Record<string, string> = {};
  return {
    data,
    setItemAsync: async (key: string, value: string) => {
      data[key] = value;
    },
    getItemAsync: async (key: string) => data[key] ?? null,
    deleteItemAsync: async (key: string) => {
      delete data[key];
    },
  };
}

const VALID_TOKEN: AuthToken = {
  accessToken: 'test-access-token',
  expiresAt: 9999999999,
};

const VALID_USER: UserProfile = {
  id: 'user-1',
  email: 'user@example.com',
  displayName: 'Test User',
};

let mockSecureStore: ReturnType<typeof createMockStore>;

beforeEach(() => {
  mockSecureStore = createMockStore();
  setSecureStore(mockSecureStore);
  useAuthStore.setState({ token: null, user: null, isAuthenticated: false });
});

describe('AuthStore initial state', () => {
  it('starts with null token and user', () => {
    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
  });

  it('starts with isAuthenticated = false', () => {
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});

describe('setToken', () => {
  it('sets the token in state', () => {
    useAuthStore.getState().setToken(VALID_TOKEN);
    expect(useAuthStore.getState().token).toEqual(VALID_TOKEN);
  });

  it('sets isAuthenticated to true', () => {
    useAuthStore.getState().setToken(VALID_TOKEN);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it('persists token to SecureStore (fire-and-forget)', async () => {
    useAuthStore.getState().setToken(VALID_TOKEN);
    await new Promise((r) => setTimeout(r, 10));
    expect(mockSecureStore.data['auth_token']).toBeDefined();
    const stored = JSON.parse(mockSecureStore.data['auth_token']);
    expect(stored.accessToken).toBe(VALID_TOKEN.accessToken);
  });
});

describe('clearAuth', () => {
  it('clears token and user from state', () => {
    useAuthStore.setState({ token: VALID_TOKEN, user: VALID_USER, isAuthenticated: true });
    useAuthStore.getState().clearAuth();
    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('sets isAuthenticated to false', () => {
    useAuthStore.setState({ token: VALID_TOKEN, isAuthenticated: true });
    useAuthStore.getState().clearAuth();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('clears token from SecureStore (fire-and-forget)', async () => {
    mockSecureStore.data['auth_token'] = JSON.stringify(VALID_TOKEN);
    useAuthStore.setState({ token: VALID_TOKEN, isAuthenticated: true });
    useAuthStore.getState().clearAuth();
    await new Promise((r) => setTimeout(r, 10));
    expect(mockSecureStore.data['auth_token']).toBeUndefined();
  });
});
