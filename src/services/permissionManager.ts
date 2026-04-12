// PermissionManager service
// Requirements: 1.2, 1.3

import type { PermissionType, PermissionStatus, PermissionResults } from '../types/index';
import { getPermissionDenials, setPermissionDenials } from '../storage/mmkv';

// ─── Adapter interface ────────────────────────────────────────────────────────

export interface PermissionsAdapter {
  request(type: PermissionType): Promise<PermissionStatus>;
  getStatus(type: PermissionType): Promise<PermissionStatus>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toStatus(status: string): PermissionStatus {
  if (status === 'granted') return 'granted';
  if (status === 'denied') return 'denied';
  return 'undetermined';
}

async function requestCameraPermission(): Promise<PermissionStatus> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('expo-camera');
    const { status } = await mod.requestCameraPermissionsAsync();
    return toStatus(status);
  } catch { return 'undetermined'; }
}

async function getCameraStatus(): Promise<PermissionStatus> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('expo-camera');
    const { status } = await mod.getCameraPermissionsAsync();
    return toStatus(status);
  } catch { return 'undetermined'; }
}

async function requestLocationPermission(): Promise<PermissionStatus> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('expo-location');
    const { status } = await mod.requestForegroundPermissionsAsync();
    return toStatus(status);
  } catch { return 'undetermined'; }
}

async function getLocationStatus(): Promise<PermissionStatus> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('expo-location');
    const { status } = await mod.getForegroundPermissionsAsync();
    return toStatus(status);
  } catch { return 'undetermined'; }
}

async function requestNotificationPermission(): Promise<PermissionStatus> {
  try {
    // expo-notifications push support was removed from Expo Go in SDK 53+
    // Detect Expo Go by checking the app ownership
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Constants = require('expo-constants').default;
    const isExpoGo = Constants?.executionEnvironment === 'storeClient';
    if (isExpoGo) return 'undetermined';

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('expo-notifications');
    if (typeof mod.requestPermissionsAsync !== 'function') return 'undetermined';
    const { status } = await mod.requestPermissionsAsync();
    return toStatus(status);
  } catch { return 'undetermined'; }
}

async function getNotificationStatus(): Promise<PermissionStatus> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Constants = require('expo-constants').default;
    const isExpoGo = Constants?.executionEnvironment === 'storeClient';
    if (isExpoGo) return 'undetermined';

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('expo-notifications');
    if (typeof mod.getPermissionsAsync !== 'function') return 'undetermined';
    const { status } = await mod.getPermissionsAsync();
    return toStatus(status);
  } catch { return 'undetermined'; }
}

// ─── Default adapter ──────────────────────────────────────────────────────────

const defaultAdapter: PermissionsAdapter = {
  async request(type) {
    if (type === 'camera') return requestCameraPermission();
    if (type === 'location') return requestLocationPermission();
    return requestNotificationPermission();
  },
  async getStatus(type) {
    if (type === 'camera') return getCameraStatus();
    if (type === 'location') return getLocationStatus();
    return getNotificationStatus();
  },
};

// ─── Adapter injection ────────────────────────────────────────────────────────

let _adapter: PermissionsAdapter = defaultAdapter;

export function setPermissionsAdapter(adapter: PermissionsAdapter): void {
  _adapter = adapter;
}

export function getPermissionsAdapter(): PermissionsAdapter {
  return _adapter;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function requestAll(): Promise<PermissionResults> {
  const [camera, location, notifications] = await Promise.all([
    _adapter.request('camera'),
    _adapter.request('location'),
    _adapter.request('notifications'),
  ]);
  return { camera, location, notifications };
}

export async function getStatus(type: PermissionType): Promise<PermissionStatus> {
  return _adapter.getStatus(type);
}

export function recordDenial(type: PermissionType): void {
  const denials = getPermissionDenials();
  if (!denials.includes(type)) {
    setPermissionDenials([...denials, type]);
  }
}
