// MMKV local storage module
// Requirements: 9.1, 1.4, 1.3

import type { TrendItem, PermissionType } from '../types/index';

// PreferencesStore shape (data-only, no methods)
export interface PreferencesData {
  categories: Array<
    'technology' | 'sports' | 'finance' | 'entertainment' | 'health' | 'science'
  >;
  notificationsEnabled: boolean;
  locationEnabled: boolean;
  biometricEnabled: boolean;
  dailyReminderTime: { hour: number; minute: number } | null;
}

// Minimal interface that react-native-mmkv's MMKV class satisfies,
// making the module easy to mock in tests.
export interface MMKVStorage {
  getString(key: string): string | undefined;
  set(key: string, value: string | boolean | number): void;
  getBoolean(key: string): boolean | undefined;
}

// Storage keys
const KEYS = {
  BOOKMARKS: 'bookmarks',
  PREFERENCES: 'preferences',
  ONBOARDING_COMPLETE: 'onboarding_complete',
  PERMISSION_DENIALS: 'permission_denials',
} as const;

// Default values
const DEFAULT_PREFERENCES: PreferencesData = {
  categories: [],
  notificationsEnabled: false,
  locationEnabled: false,
  biometricEnabled: false,
  dailyReminderTime: null,
};

// The storage instance — created lazily so tests can inject a mock before import side-effects run.
// In production (Expo), react-native-mmkv is available natively.
let _storage: MMKVStorage | null = null;

export function getStorage(): MMKVStorage {
  if (!_storage) {
    // Dynamically require so tests can mock the module before this runs.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { MMKV } = require('react-native-mmkv') as { MMKV: new (config?: { id?: string }) => MMKVStorage };
    _storage = new MMKV({ id: 'trendify-storage' });
  }
  return _storage;
}

/** Override the storage instance (useful for testing). */
export function setStorage(storage: MMKVStorage): void {
  _storage = storage;
}

// ─── Typed helpers ────────────────────────────────────────────────────────────

export function getBookmarks(): TrendItem[] {
  const raw = getStorage().getString(KEYS.BOOKMARKS);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as TrendItem[];
  } catch {
    return [];
  }
}

export function setBookmarks(items: TrendItem[]): void {
  getStorage().set(KEYS.BOOKMARKS, JSON.stringify(items));
}

export function getPreferences(): PreferencesData {
  const raw = getStorage().getString(KEYS.PREFERENCES);
  if (!raw) return { ...DEFAULT_PREFERENCES };
  try {
    return { ...DEFAULT_PREFERENCES, ...(JSON.parse(raw) as Partial<PreferencesData>) };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

export function setPreferences(prefs: PreferencesData): void {
  getStorage().set(KEYS.PREFERENCES, JSON.stringify(prefs));
}

export function getOnboardingComplete(): boolean {
  return getStorage().getBoolean(KEYS.ONBOARDING_COMPLETE) ?? false;
}

export function setOnboardingComplete(value: boolean): void {
  getStorage().set(KEYS.ONBOARDING_COMPLETE, value);
}

export function getPermissionDenials(): PermissionType[] {
  const raw = getStorage().getString(KEYS.PERMISSION_DENIALS);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as PermissionType[];
  } catch {
    return [];
  }
}

export function setPermissionDenials(denials: PermissionType[]): void {
  getStorage().set(KEYS.PERMISSION_DENIALS, JSON.stringify(denials));
}
