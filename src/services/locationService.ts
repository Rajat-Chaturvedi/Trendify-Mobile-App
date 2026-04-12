// Location Service
// Requirements: 5.1, 5.2, 5.3

import type { Coordinates, PermissionStatus } from '../types/index';

const TIMEOUT_MS = 10_000;

// ─── Adapter ──────────────────────────────────────────────────────────────────

export interface LocationAdapter {
  requestPermission(): Promise<PermissionStatus>;
  getCurrentPosition(timeoutMs: number): Promise<Coordinates | null>;
  reverseGeocode(coords: Coordinates): Promise<string>;
}

const defaultAdapter: LocationAdapter = {
  async requestPermission() {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Location = require('expo-location') as {
      requestForegroundPermissionsAsync(): Promise<{ status: string }>;
    };
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined';
  },

  async getCurrentPosition(timeoutMs) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Location = require('expo-location') as {
      getCurrentPositionAsync(opts: object): Promise<{ coords: { latitude: number; longitude: number; accuracy?: number } }>;
    };
    const result = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: 3 }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
    ]);
    if (!result) return null;
    return {
      latitude: result.coords.latitude,
      longitude: result.coords.longitude,
      accuracy: result.coords.accuracy,
    };
  },

  async reverseGeocode(coords) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Location = require('expo-location') as {
      reverseGeocodeAsync(coords: { latitude: number; longitude: number }): Promise<Array<{ isoCountryCode?: string }>>;
    };
    const results = await Location.reverseGeocodeAsync(coords);
    return results[0]?.isoCountryCode ?? 'US';
  },
};

let _adapter: LocationAdapter = defaultAdapter;

export function setLocationAdapter(adapter: LocationAdapter): void {
  _adapter = adapter;
}

// ─── LocationService ──────────────────────────────────────────────────────────

export async function requestPermission(): Promise<PermissionStatus> {
  return _adapter.requestPermission();
}

export async function getCurrentCoordinates(timeoutMs = TIMEOUT_MS): Promise<Coordinates | null> {
  return _adapter.getCurrentPosition(timeoutMs);
}

export async function resolveRegionCode(coords: Coordinates): Promise<string> {
  return _adapter.reverseGeocode(coords);
}
