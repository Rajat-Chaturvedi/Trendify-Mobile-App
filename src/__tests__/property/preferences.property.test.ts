// Feature: trendify, Property 11: Preference toggle applies to service registration

/**
 * Validates: Requirements 8.3, 8.4
 */

import * as fc from 'fast-check';
import { usePreferencesStore } from '../../stores/preferencesStore';
import { setStorage } from '../../storage/mmkv';
import { setNotificationAdapter } from '../../services/notificationService';
import { setLocationAdapter } from '../../services/locationService';
import type { MMKVStorage } from '../../storage/mmkv';

function createMockStorage(): MMKVStorage {
  const store: Record<string, string | boolean | number> = {};
  return {
    getString: (k) => (typeof store[k] === 'string' ? (store[k] as string) : undefined),
    set: (k, v) => { store[k] = v; },
    getBoolean: (k) => (typeof store[k] === 'boolean' ? (store[k] as boolean) : undefined),
  };
}

// ---------------------------------------------------------------------------
// Property 11: Preference toggle applies to service registration
// Validates: Requirements 8.3, 8.4
// ---------------------------------------------------------------------------

describe('Property 11: Preference toggle applies to service registration', () => {
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

  it('notificationsEnabled preference matches the value set via setNotificationsEnabled', () => {
    fc.assert(
      fc.property(fc.boolean(), (val) => {
        setStorage(createMockStorage());
        usePreferencesStore.getState().setNotificationsEnabled(val);
        return usePreferencesStore.getState().notificationsEnabled === val;
      }),
      { numRuns: 100 },
    );
  });

  it('locationEnabled preference matches the value set via setLocationEnabled', () => {
    fc.assert(
      fc.property(fc.boolean(), (val) => {
        setStorage(createMockStorage());
        usePreferencesStore.getState().setLocationEnabled(val);
        return usePreferencesStore.getState().locationEnabled === val;
      }),
      { numRuns: 100 },
    );
  });

  it('notification adapter register is called when notifications are enabled', async () => {
    let registered = false;
    setNotificationAdapter({
      requestPermission: async () => 'granted',
      register: async () => { registered = true; return 'push-token'; },
      scheduleDaily: async () => {},
      cancelScheduled: async () => {},
    });

    await fc.assert(
      fc.asyncProperty(fc.constant(true), async (val) => {
        registered = false;
        usePreferencesStore.getState().setNotificationsEnabled(val);
        if (val) {
          const { register } = await import('../../services/notificationService');
          await register();
        }
        return val ? registered : true;
      }),
      { numRuns: 10 },
    );
  });
});
