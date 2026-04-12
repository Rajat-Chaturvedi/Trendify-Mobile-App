// Unit tests for navigation routing logic
// Requirements: 10.1, 10.3, 1.1

import { setStorage, setOnboardingComplete, getOnboardingComplete } from '../../storage/mmkv';
import { useAuthStore } from '../../stores/authStore';
import { setSecureStore } from '../../storage/secureStore';
import type { MMKVStorage } from '../../storage/mmkv';
import type { SecureStoreAdapter } from '../../storage/secureStore';

function createMockStorage(): MMKVStorage {
  const store: Record<string, string | boolean | number> = {};
  return {
    getString: (k) => (typeof store[k] === 'string' ? (store[k] as string) : undefined),
    set: (k, v) => { store[k] = v; },
    getBoolean: (k) => (typeof store[k] === 'boolean' ? (store[k] as boolean) : undefined),
  };
}

function createMockSecureStore(): SecureStoreAdapter {
  const data: Record<string, string> = {};
  return {
    setItemAsync: async (k, v) => { data[k] = v; },
    getItemAsync: async (k) => data[k] ?? null,
    deleteItemAsync: async (k) => { delete data[k]; },
  };
}

beforeEach(() => {
  setStorage(createMockStorage());
  setSecureStore(createMockSecureStore());
  useAuthStore.setState({ token: null, user: null, isAuthenticated: false });
});

// ─── Onboarding gating ────────────────────────────────────────────────────────

describe('onboarding gating', () => {
  it('onboarding_complete is false by default', () => {
    expect(getOnboardingComplete()).toBe(false);
  });

  it('onboarding_complete is true after setOnboardingComplete(true)', () => {
    setOnboardingComplete(true);
    expect(getOnboardingComplete()).toBe(true);
  });

  it('onboarding_complete persists across storage reads', () => {
    setOnboardingComplete(true);
    // Simulate re-reading from the same storage instance
    expect(getOnboardingComplete()).toBe(true);
  });
});

// ─── Auth gating ──────────────────────────────────────────────────────────────

describe('auth gating', () => {
  it('isAuthenticated is false by default', () => {
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('isAuthenticated becomes true after setToken', () => {
    useAuthStore.getState().setToken({ accessToken: 'tok', expiresAt: 9999999999 });
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it('isAuthenticated becomes false after clearAuth', () => {
    useAuthStore.setState({ token: { accessToken: 'tok', expiresAt: 9999999999 }, isAuthenticated: true });
    useAuthStore.getState().clearAuth();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});

// ─── Route determination logic ────────────────────────────────────────────────

describe('route determination', () => {
  function determineRoute(): 'Onboarding' | 'Auth' | 'Main' {
    if (!getOnboardingComplete()) return 'Onboarding';
    if (!useAuthStore.getState().isAuthenticated) return 'Auth';
    return 'Main';
  }

  it('routes to Onboarding when onboarding is not complete', () => {
    expect(determineRoute()).toBe('Onboarding');
  });

  it('routes to Auth when onboarding is complete but not authenticated', () => {
    setOnboardingComplete(true);
    expect(determineRoute()).toBe('Auth');
  });

  it('routes to Main when onboarding is complete and authenticated', () => {
    setOnboardingComplete(true);
    useAuthStore.setState({ token: { accessToken: 'tok', expiresAt: 9999999999 }, isAuthenticated: true });
    expect(determineRoute()).toBe('Main');
  });
});
