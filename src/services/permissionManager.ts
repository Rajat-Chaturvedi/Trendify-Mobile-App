// PermissionManager service
// Requirements: 1.2, 1.3

import type { PermissionType, PermissionStatus, PermissionResults } from '../types/index';
import { getPermissionDenials, setPermissionDenials } from '../storage/mmkv';

// ─── Adapter interface ────────────────────────────────────────────────────────

/** Minimal interface for requesting and querying permissions. */
export interface PermissionsAdapter {
  request(type: PermissionType): Promise<PermissionStatus>;
  getStatus(type: PermissionType): Promise<PermissionStatus>;
}

// ─── Default (production) adapter ────────────────────────────────────────────

/**
 * Maps a PermissionType to the appropriate Expo module and invokes it.
 * Dynamically required so tests can inject a mock before this runs.
 */
const defaultAdapter: PermissionsAdapter = {
  async request(type: PermissionType): Promise<PermissionStatus> {
    if (type === 'camera') {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { requestCameraPermissionsAsync } = require('expo-camera') as {
        requestCameraPermissionsAsync(): Promise<{ status: string }>;
      };
      const { status } = await requestCameraPermissionsAsync();
      return status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined';
    }
    if (type === 'location') {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { requestForegroundPermissionsAsync } = require('expo-location') as {
        requestForegroundPermissionsAsync(): Promise<{ status: string }>;
      };
      const { status } = await requestForegroundPermissionsAsync();
      return status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined';
    }
    // notifications
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { requestPermissionsAsync } = require('expo-notifications') as {
      requestPermissionsAsync(): Promise<{ status: string }>;
    };
    const { status } = await requestPermissionsAsync();
    return status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined';
  },

  async getStatus(type: PermissionType): Promise<PermissionStatus> {
    if (type === 'camera') {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { getCameraPermissionsAsync } = require('expo-camera') as {
        getCameraPermissionsAsync(): Promise<{ status: string }>;
      };
      const { status } = await getCameraPermissionsAsync();
      return status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined';
    }
    if (type === 'location') {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { getForegroundPermissionsAsync } = require('expo-location') as {
        getForegroundPermissionsAsync(): Promise<{ status: string }>;
      };
      const { status } = await getForegroundPermissionsAsync();
      return status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined';
    }
    // notifications
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getPermissionsAsync } = require('expo-notifications') as {
      getPermissionsAsync(): Promise<{ status: string }>;
    };
    const { status } = await getPermissionsAsync();
    return status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined';
  },
};

// ─── Adapter injection ────────────────────────────────────────────────────────

let _adapter: PermissionsAdapter = defaultAdapter;

/** Override the permissions adapter (useful for testing). */
export function setPermissionsAdapter(adapter: PermissionsAdapter): void {
  _adapter = adapter;
}

/** Returns the current permissions adapter. */
export function getPermissionsAdapter(): PermissionsAdapter {
  return _adapter;
}

// ─── PermissionManager ───────────────────────────────────────────────────────

/**
 * Requests camera, location, and notification permissions in sequence.
 * Returns the resulting status for each type.
 */
export async function requestAll(): Promise<PermissionResults> {
  const adapter = getPermissionsAdapter();
  const [camera, location, notifications] = await Promise.all([
    adapter.request('camera'),
    adapter.request('location'),
    adapter.request('notifications'),
  ]);
  return { camera, location, notifications };
}

/**
 * Returns the current permission status for the given type.
 */
export async function getStatus(type: PermissionType): Promise<PermissionStatus> {
  return getPermissionsAdapter().getStatus(type);
}

/**
 * Records a permission denial in MMKV storage.
 * Adds the type to the denial list if not already present.
 */
export function recordDenial(type: PermissionType): void {
  const denials = getPermissionDenials();
  if (!denials.includes(type)) {
    setPermissionDenials([...denials, type]);
  }
}
