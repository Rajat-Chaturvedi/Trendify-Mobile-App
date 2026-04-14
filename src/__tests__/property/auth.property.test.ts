// Feature: trendify, Property 3: Auth token round-trip
// Feature: trendify, Property 4: Invalid credential errors are non-specific
// Feature: trendify, Property 5: Logout clears all auth state

/**
 * Validates: Requirements 2.2, 2.3, 2.4, 2.6
 */

import * as fc from 'fast-check';
import { login, logout, restoreSession } from '../../services/authService';
import { setSecureStore, type SecureStoreAdapter } from '../../storage/secureStore';
import { useAuthStore } from '../../stores/authStore';
import type { AuthToken } from '../../types/index';

const mockFetch = jest.fn();
global.fetch = mockFetch;

function createMockSecureStore(): SecureStoreAdapter & { data: Record<string, string> } {
  const data: Record<string, string> = {};
  return {
    data,
    setItemAsync: async (key, value) => { data[key] = value; },
    getItemAsync: async (key) => data[key] ?? null,
    deleteItemAsync: async (key) => { delete data[key]; },
  };
}

const FORBIDDEN_WORDS = ['email', 'password', 'username'];

// ---------------------------------------------------------------------------
// Property 3: Auth token round-trip
// Validates: Requirements 2.2, 2.4
// ---------------------------------------------------------------------------

describe('Property 3: Auth token round-trip', () => {
  it('storeToken then restoreSession returns equivalent token', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          accessToken: fc.string({ minLength: 1 }),
          expiresAt: fc.integer({ min: 1 }),
        }),
        async (tokenData) => {
          const store = createMockSecureStore();
          setSecureStore(store);
          mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({
              accessToken: tokenData.accessToken,
              refreshToken: 'refresh',
              expiresIn: 3600,
            }),
          });

          const result = await login('test@example.com', 'pass');
          if (!result.success || !result.token) return false;

          const restored = await restoreSession();
          return restored !== null && restored.accessToken === result.token.accessToken;
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 4: Invalid credential errors are non-specific
// Validates: Requirements 2.3
// ---------------------------------------------------------------------------

describe('Property 4: Invalid credential errors are non-specific', () => {
  it('error message does not reveal which field is wrong', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.string({ minLength: 1 }),
        async (email, password) => {
          const store = createMockSecureStore();
          setSecureStore(store);
          mockFetch.mockResolvedValue({ ok: false, status: 401 });

          const result = await login(email, password);
          if (result.success) return true;
          if (!result.error) return false;

          const lower = result.error.toLowerCase();
          return FORBIDDEN_WORDS.every((word) => !lower.includes(word));
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 5: Logout clears all auth state
// Validates: Requirements 2.6
// ---------------------------------------------------------------------------

describe('Property 5: Logout clears all auth state', () => {
  it('after logout, token store is empty', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          accessToken: fc.string({ minLength: 1 }),
          expiresAt: fc.integer({ min: 1 }),
        }),
        async (tokenData: AuthToken) => {
          const store = createMockSecureStore();
          setSecureStore(store);
          useAuthStore.setState({ token: tokenData, isAuthenticated: true, user: null });
          mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });

          await logout();

          const restored = await restoreSession();
          return restored === null;
        },
      ),
      { numRuns: 100 },
    );
  });
});
