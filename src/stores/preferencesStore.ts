// Preferences Store — syncs with real API
// Requirements: 8.2, 8.3, 8.4

import { createStore } from 'zustand/vanilla';
import type { Category } from '../types/index';
import { getPreferences, setPreferences } from '../storage/mmkv';

interface PreferencesStore {
  categories: Category[];
  notificationsEnabled: boolean;
  locationEnabled: boolean;
  biometricEnabled: boolean;
  dailyReminderTime: { hour: number; minute: number } | null;
  setCategories(cats: Category[]): void;
  setNotificationsEnabled(val: boolean): void;
  setLocationEnabled(val: boolean): void;
  setBiometricEnabled(val: boolean): void;
  setDailyReminderTime(time: { hour: number; minute: number } | null): void;
  syncFromApi(): Promise<void>;
  pushToApi(): Promise<void>;
}

const initial = getPreferences();

async function updateApiPreferences(categories: Category[]): Promise<void> {
  try {
    const { apiFetch } = await import('../api/http');
    await apiFetch('/users/me/preferences', {
      method: 'PUT',
      body: JSON.stringify({ categories }),
    });
  } catch { /* offline */ }
}

export const usePreferencesStore = createStore<PreferencesStore>((set, get) => ({
  categories: initial.categories as Category[],
  notificationsEnabled: initial.notificationsEnabled,
  locationEnabled: initial.locationEnabled,
  biometricEnabled: initial.biometricEnabled,
  dailyReminderTime: initial.dailyReminderTime,

  setCategories(cats) {
    set({ categories: cats });
    setPreferences({ ...get(), categories: cats });
    updateApiPreferences(cats);
  },
  setNotificationsEnabled(val) {
    set({ notificationsEnabled: val });
    setPreferences({ ...get(), notificationsEnabled: val });
  },
  setLocationEnabled(val) {
    set({ locationEnabled: val });
    setPreferences({ ...get(), locationEnabled: val });
  },
  setBiometricEnabled(val) {
    set({ biometricEnabled: val });
    setPreferences({ ...get(), biometricEnabled: val });
  },
  setDailyReminderTime(time) {
    set({ dailyReminderTime: time });
    setPreferences({ ...get(), dailyReminderTime: time });
  },

  async syncFromApi() {
    try {
      const { apiFetch } = await import('../api/http');
      const res = await apiFetch('/users/me/preferences');
      if (!res.ok) return;
      const data = (await res.json()) as { categories?: Category[] };
      if (data.categories) {
        set({ categories: data.categories });
        setPreferences({ ...get(), categories: data.categories });
      }
    } catch { /* offline */ }
  },

  async pushToApi() {
    await updateApiPreferences(get().categories);
  },
}));
