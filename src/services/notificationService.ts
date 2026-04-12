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

const defaultAdapter: NotificationAdapter = {
  async requestPermission() {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Notifications = require('expo-notifications') as {
      requestPermissionsAsync(): Promise<{ status: string }>;
    };
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined';
  },

  async register() {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Notifications = require('expo-notifications') as {
      getExpoPushTokenAsync(): Promise<{ data: string }>;
    };
    try {
      const { data } = await Notifications.getExpoPushTokenAsync();
      return data;
    } catch {
      return null;
    }
  },

  async scheduleDaily(hour, minute) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Notifications = require('expo-notifications') as {
      scheduleNotificationAsync(req: object): Promise<string>;
    };
    await Notifications.scheduleNotificationAsync({
      content: { title: "Today's Trends", body: 'Check out what is trending today.' },
      trigger: { hour, minute, repeats: true },
    });
  },

  async cancelScheduled() {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Notifications = require('expo-notifications') as {
      cancelAllScheduledNotificationsAsync(): Promise<void>;
    };
    await Notifications.cancelAllScheduledNotificationsAsync();
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
