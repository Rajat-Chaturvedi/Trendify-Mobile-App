// Unit tests for PreferencesStore
// Requirements: 8.2, 8.3, 8.4

import { setStorage, getPreferences, type MMKVStorage } from '../../storage/mmkv';
import { usePreferencesStore } from '../../stores/preferencesStore';
import type { Category } from '../../types/index';

function createMockStorage(): MMKVStorage & { data: Record<string, string | boolean | number> } {
  const data: Record<string, string | boolean | number> = {};
  return {
    data,
    getString: (key: string) => {
      const v = data[key];
      return typeof v === 'string' ? v : undefined;
    },
    set: (key: string, value: string | boolean | number) => {
      data[key] = value;
    },
    getBoolean: (key: string) => {
      const v = data[key];
      return typeof v === 'boolean' ? v : undefined;
    },
  };
}

let mockStorage: ReturnType<typeof createMockStorage>;

beforeEach(() => {
  mockStorage = createMockStorage();
  setStorage(mockStorage);
  usePreferencesStore.setState({
    categories: [],
    notificationsEnabled: false,
    locationEnabled: false,
    biometricEnabled: false,
    dailyReminderTime: null,
  });
});

describe('PreferencesStore initial state', () => {
  it('starts with empty categories', () => {
    expect(usePreferencesStore.getState().categories).toEqual([]);
  });

  it('starts with all booleans false', () => {
    const s = usePreferencesStore.getState();
    expect(s.notificationsEnabled).toBe(false);
    expect(s.locationEnabled).toBe(false);
    expect(s.biometricEnabled).toBe(false);
  });

  it('starts with null dailyReminderTime', () => {
    expect(usePreferencesStore.getState().dailyReminderTime).toBeNull();
  });
});

describe('setCategories', () => {
  it('updates categories in state', () => {
    const cats: Category[] = ['technology', 'sports'];
    usePreferencesStore.getState().setCategories(cats);
    expect(usePreferencesStore.getState().categories).toEqual(cats);
  });

  it('persists categories to MMKV', () => {
    const cats: Category[] = ['finance', 'health'];
    usePreferencesStore.getState().setCategories(cats);
    expect(getPreferences().categories).toEqual(cats);
  });

  it('replaces previous categories', () => {
    usePreferencesStore.getState().setCategories(['technology']);
    usePreferencesStore.getState().setCategories(['sports', 'science']);
    expect(usePreferencesStore.getState().categories).toEqual(['sports', 'science']);
  });
});

describe('setNotificationsEnabled', () => {
  it('updates notificationsEnabled in state', () => {
    usePreferencesStore.getState().setNotificationsEnabled(true);
    expect(usePreferencesStore.getState().notificationsEnabled).toBe(true);
  });

  it('persists notificationsEnabled to MMKV', () => {
    usePreferencesStore.getState().setNotificationsEnabled(true);
    expect(getPreferences().notificationsEnabled).toBe(true);
  });

  it('can be toggled back to false', () => {
    usePreferencesStore.getState().setNotificationsEnabled(true);
    usePreferencesStore.getState().setNotificationsEnabled(false);
    expect(usePreferencesStore.getState().notificationsEnabled).toBe(false);
  });
});

describe('setLocationEnabled', () => {
  it('updates locationEnabled in state', () => {
    usePreferencesStore.getState().setLocationEnabled(true);
    expect(usePreferencesStore.getState().locationEnabled).toBe(true);
  });

  it('persists locationEnabled to MMKV', () => {
    usePreferencesStore.getState().setLocationEnabled(true);
    expect(getPreferences().locationEnabled).toBe(true);
  });
});

describe('setBiometricEnabled', () => {
  it('updates biometricEnabled in state', () => {
    usePreferencesStore.getState().setBiometricEnabled(true);
    expect(usePreferencesStore.getState().biometricEnabled).toBe(true);
  });

  it('persists biometricEnabled to MMKV', () => {
    usePreferencesStore.getState().setBiometricEnabled(true);
    expect(getPreferences().biometricEnabled).toBe(true);
  });
});

describe('setDailyReminderTime', () => {
  it('updates dailyReminderTime in state', () => {
    const time = { hour: 9, minute: 0 };
    usePreferencesStore.getState().setDailyReminderTime(time);
    expect(usePreferencesStore.getState().dailyReminderTime).toEqual(time);
  });

  it('persists dailyReminderTime to MMKV', () => {
    const time = { hour: 7, minute: 30 };
    usePreferencesStore.getState().setDailyReminderTime(time);
    expect(getPreferences().dailyReminderTime).toEqual(time);
  });

  it('can be set to null', () => {
    usePreferencesStore.getState().setDailyReminderTime({ hour: 8, minute: 0 });
    usePreferencesStore.getState().setDailyReminderTime(null);
    expect(usePreferencesStore.getState().dailyReminderTime).toBeNull();
    expect(getPreferences().dailyReminderTime).toBeNull();
  });
});

describe('MMKV persistence across setters', () => {
  it('persists all fields together on each mutation', () => {
    usePreferencesStore.getState().setCategories(['technology']);
    usePreferencesStore.getState().setNotificationsEnabled(true);
    usePreferencesStore.getState().setLocationEnabled(true);

    const prefs = getPreferences();
    expect(prefs.categories).toEqual(['technology']);
    expect(prefs.notificationsEnabled).toBe(true);
    expect(prefs.locationEnabled).toBe(true);
    expect(prefs.biometricEnabled).toBe(false);
  });
});
