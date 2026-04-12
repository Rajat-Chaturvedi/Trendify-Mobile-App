// Notification Service
// Requirements: 7.1, 7.4

import type { PermissionStatus } from '../types/index';

// ─── Adapter ──────────────────────────────────────────────────────────────────

export interface NotificationAdapter {
  requestPermission(): Promise<PermissionStatus>;
  register(): Promise<string | null>;
  scheduleDaily(hour: number, minute: number): Promise<void>;
  cancelScheduled(): Promise<void>;
}

function isExpoGo(): boolean {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Constants = require('expo-constants').default;
    return Constants?.executionEnvironment === 'storeClient';
  } catch { return false; }
}

const defaultAdapter: NotificationAdapter = {
  async requestPermission() {
    if (isExpoGo()) return 'undetermined';
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const Notifications = require('expo-notifications') as {
        requestPermissionsAsync(): Promise<{ status: string }>;
      };
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined';
    } catch { return 'undetermined'; }
  },

  async register() {
    if (isExpoGo()) return null;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const Notifications = require('expo-notifications') as {
        getExpoPushTokenAsync(): Promise<{ data: string }>;
      };
      const { data } = await Notifications.getExpoPushTokenAsync();
      return data;
    } catch { return null; }
  },

  async scheduleDaily(hour, minute) {
    if (isExpoGo()) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const Notifications = require('expo-notifications') as {
        scheduleNotificationAsync(req: object): Promise<string>;
      };
      await Notifications.scheduleNotificationAsync({
        content: { title: "Today's Trends", body: 'Check out what is trending today.' },
        trigger: { hour, minute, repeats: true },
      });
    } catch {}
  },

  async cancelScheduled() {
    if (isExpoGo()) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const Notifications = require('expo-notifications') as {
        cancelAllScheduledNotificationsAsync(): Promise<void>;
      };
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch {}
  },
};

let _adapter: NotificationAdapter = defaultAdapter;

export function setNotificationAdapter(adapter: NotificationAdapter): void {
  _adapter = adapter;
}

// ─── NotificationService ──────────────────────────────────────────────────────

export async function requestPermission(): Promise<PermissionStatus> {
  return _adapter.requestPermission();
}

export async function register(): Promise<string | null> {
  return _adapter.register();
}

export async function scheduleDaily(hour: number, minute: number): Promise<void> {
  return _adapter.scheduleDaily(hour, minute);
}

export async function cancelScheduled(): Promise<void> {
  return _adapter.cancelScheduled();
}
