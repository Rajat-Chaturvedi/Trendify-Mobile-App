// Unit tests for ProfileScreen logic (store + service interactions)
// Requirements: 8.1, 8.2, 8.3, 8.4, 8.5

import { usePreferencesStore } from '../../stores/preferencesStore';
import { setStorage } from '../../storage/mmkv';
import { setPermissionsAdapter } from '../../services/permissionManager';
import { getStatus } from '../../services/permissionManager';
import { setNotificationAdapter } from '../../services/notificationService';
import type { MMKVStorage } from '../../storage/mmkv';
import type { Category, PermissionStatus } from '../../types/index';

function createMockStorage(): MMKVStorage {
  const store: Record<string, string | boolean | number> = {};
  return {
    getString: (k) => (typeof store[k] === 'string' ? (store[k] as string) : undefined),
    set: (k, v) => { store[k] = v; },
    getBoolean: (k) => (typeof store[k] === 'boolean' ? (store[k] as boolean) : undefined),
  };
}

beforeEach(() => {
  setStorage(createMockStorage());
  usePreferencesStore.setState({
    categories: [],
    notificationsEnabled: false,
    locationEnabled: false,
    biometricEnabled: false,
    dailyReminderTime: null,
  });
});

// ─── Category selection ───────────────────────────────────────────────────────

describe('category selection', () => {
  it('setCategories persists to store', () => {
    const cats: Category[] = ['technology', 'sports'];
    usePreferencesStore.getState().setCategories(cats);
    expect(usePreferencesStore.getState().categories).toEqual(cats);
  });

  it('setCategories overwrites previous selection', () => {
    usePreferencesStore.getState().setCategories(['technology']);
    usePreferencesStore.getState().setCategories(['sports', 'finance']);
    expect(usePreferencesStore.getState().categories).toEqual(['sports', 'finance']);
  });

  it('setCategories with empty array clears selection', () => {
    usePreferencesStore.getState().setCategories(['technology']);
    usePreferencesStore.getState().setCategories([]);
    expect(usePreferencesStore.getState().categories).toEqual([]);
  });
});

// ─── Notification toggle ──────────────────────────────────────────────────────

describe('notification toggle', () => {
  it('setNotificationsEnabled(true) updates store', () => {
    usePreferencesStore.getState().setNotificationsEnabled(true);
    expect(usePreferencesStore.getState().notificationsEnabled).toBe(true);
  });

  it('setNotificationsEnabled(false) updates store', () => {
    usePreferencesStore.getState().setNotificationsEnabled(true);
    usePreferencesStore.getState().setNotificationsEnabled(false);
    expect(usePreferencesStore.getState().notificationsEnabled).toBe(false);
  });

  it('register is called when notifications are enabled', async () => {
    let called = false;
    setNotificationAdapter({
      requestPermission: async () => 'granted',
      register: async () => { called = true; return 'token'; },
      scheduleDaily: async () => {},
      cancelScheduled: async () => {},
    });
    const { register } = await import('../../services/notificationService');
    await register();
    expect(called).toBe(true);
  });
});

// ─── Location toggle ──────────────────────────────────────────────────────────

describe('location toggle', () => {
  it('setLocationEnabled(true) updates store', () => {
    usePreferencesStore.getState().setLocationEnabled(true);
    expect(usePreferencesStore.getState().locationEnabled).toBe(true);
  });

  it('setLocationEnabled(false) updates store', () => {
    usePreferencesStore.getState().setLocationEnabled(true);
    usePreferencesStore.getState().setLocationEnabled(false);
    expect(usePreferencesStore.getState().locationEnabled).toBe(false);
  });
});

// ─── Permission badges ────────────────────────────────────────────────────────

describe('permission status badges', () => {
  it('getStatus returns granted when adapter returns granted', async () => {
    setPermissionsAdapter({
      request: async () => 'granted',
      getStatus: async () => 'granted',
    });
    expect(await getStatus('camera')).toBe('granted');
  });

  it('getStatus returns denied when adapter returns denied', async () => {
    setPermissionsAdapter({
      request: async () => 'denied',
      getStatus: async () => 'denied',
    });
    expect(await getStatus('location')).toBe('denied');
  });

  it('getStatus returns undetermined when adapter returns undetermined', async () => {
    setPermissionsAdapter({
      request: async () => 'undetermined',
      getStatus: async () => 'undetermined',
    });
    expect(await getStatus('notifications')).toBe('undetermined');
  });
});
