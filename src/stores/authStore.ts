// Auth Store
// Requirements: 2.2, 2.6

import { create } from 'zustand';
import type { AuthToken, UserProfile } from '../types/index';
import { storeToken, clearToken } from '../storage/secureStore';

interface AuthStore {
  token: AuthToken | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  setToken(token: AuthToken): void;
  clearAuth(): void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,

  setToken(token: AuthToken) {
    set({ token, isAuthenticated: true });
    storeToken(token); // fire-and-forget
  },

  clearAuth() {
    set({ token: null, user: null, isAuthenticated: false });
    clearToken(); // fire-and-forget
  },
}));
