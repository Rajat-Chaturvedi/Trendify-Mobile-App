// Unit tests for MMKV storage helpers
// Requirements: 9.1, 1.4, 1.3

import {
  setStorage,
  getBookmarks,
  setBookmarks,
  getPreferences,
  setPreferences,
  getOnboardingComplete,
  setOnboardingComplete,
  getPermissionDenials,
  setPermissionDenials,
  type MMKVStorage,
  type PreferencesData,
} from '../../storage/mmkv';
import type { TrendItem, PermissionType } from '../../types/index';

// In-memory mock for MMKVStorage
function createMockStorage(): MMKVStorage {
  const store: Record<string, string | boolean | number> = {};
  return {
    getString: (key: string) => {
      const v = store[key];
      return typeof v === 'string' ? v : undefined;
    },
    set: (key: string, value: string | boolean | number) => {
      store[key] = value;
    },
    getBoolean: (key: string) => {
      const v = store[key];
      return typeof v === 'boolean' ? v : undefined;
    },
  };
}

const SAMPLE_ITEM: TrendItem = {
  id: 'abc-123',
  title: 'Test Trend',
  description: 'A test trend item',
  source: 'TestSource',
  publishedAt: '2024-01-01T00:00:00.000Z',
  url: 'https://example.com/trend',
  category: 'technology',
};

beforeEach(() => {
  setStorage(createMockStorage());
});

// ─── Bookmarks ────────────────────────────────────────────────────────────────

describe('bookmarks', () => {
  it('returns empty array when no bookmarks stored', () => {
    expect(getBookmarks()).toEqual([]);
  });

  it('round-trips a list of bookmarks', () => {
    setBookmarks([SAMPLE_ITEM]);
    expect(getBookmarks()).toEqual([SAMPLE_ITEM]);
  });

  it('overwrites previous bookmarks on set', () => {
    const second: TrendItem = { ...SAMPLE_ITEM, id: 'xyz-456', title: 'Second' };
    setBookmarks([SAMPLE_ITEM]);
    setBookmarks([second]);
    expect(getBookmarks()).toEqual([second]);
  });

  it('stores multiple items', () => {
    const items = [SAMPLE_ITEM, { ...SAMPLE_ITEM, id: 'id-2' }];
    setBookmarks(items);
    expect(getBookmarks()).toHaveLength(2);
  });
});

// ─── Preferences ─────────────────────────────────────────────────────────────

describe('preferences', () => {
  it('returns default preferences when nothing stored', () => {
    const prefs = getPreferences();
    expect(prefs.categories).toEqual([]);
    expect(prefs.notificationsEnabled).toBe(false);
    expect(prefs.locationEnabled).toBe(false);
    expect(prefs.biometricEnabled).toBe(false);
    expect(prefs.dailyReminderTime).toBeNull();
  });

  it('round-trips preferences', () => {
    const prefs: PreferencesData = {
      categories: ['technology', 'sports'],
      notificationsEnabled: true,
      locationEnabled: true,
      biometricEnabled: false,
      dailyReminderTime: { hour: 8, minute: 30 },
    };
    setPreferences(prefs);
    expect(getPreferences()).toEqual(prefs);
  });

  it('merges stored partial data with defaults', () => {
    // Simulate a stored value missing some fields
    const partial = { categories: ['finance'] };
    setStorage({
      getString: (key: string) =>
        key === 'preferences' ? JSON.stringify(partial) : undefined,
      set: () => {},
      getBoolean: () => undefined,
    });
    const prefs = getPreferences();
    expect(prefs.categories).toEqual(['finance']);
    expect(prefs.notificationsEnabled).toBe(false); // default
  });
});

// ─── Onboarding complete ──────────────────────────────────────────────────────

describe('onboardingComplete', () => {
  it('returns false when not set', () => {
    expect(getOnboardingComplete()).toBe(false);
  });

  it('returns true after setting to true', () => {
    setOnboardingComplete(true);
    expect(getOnboardingComplete()).toBe(true);
  });

  it('returns false after setting to false', () => {
    setOnboardingComplete(true);
    setOnboardingComplete(false);
    expect(getOnboardingComplete()).toBe(false);
  });
});

// ─── Permission denials ───────────────────────────────────────────────────────

describe('permissionDenials', () => {
  it('returns empty array when nothing stored', () => {
    expect(getPermissionDenials()).toEqual([]);
  });

  it('round-trips a list of denied permissions', () => {
    const denials: PermissionType[] = ['camera', 'location'];
    setPermissionDenials(denials);
    expect(getPermissionDenials()).toEqual(denials);
  });

  it('overwrites previous denials on set', () => {
    setPermissionDenials(['camera']);
    setPermissionDenials(['notifications']);
    expect(getPermissionDenials()).toEqual(['notifications']);
  });

  it('handles all permission types', () => {
    const all: PermissionType[] = ['camera', 'location', 'notifications'];
    setPermissionDenials(all);
    expect(getPermissionDenials()).toEqual(all);
  });
});
