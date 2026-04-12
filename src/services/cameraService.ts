// Camera Service
// Requirements: 6.1, 6.2

import type { CaptureResult, PermissionStatus } from '../types/index';

// ─── Adapter ──────────────────────────────────────────────────────────────────

export interface CameraAdapter {
  requestPermission(): Promise<PermissionStatus>;
  openCamera(): Promise<CaptureResult | null>;
}

const defaultAdapter: CameraAdapter = {
  async requestPermission() {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Camera = require('expo-camera') as {
      requestCameraPermissionsAsync(): Promise<{ status: string }>;
    };
    const { status } = await Camera.requestCameraPermissionsAsync();
    return status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined';
  },

  async openCamera() {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const ImagePicker = require('expo-image-picker') as {
      launchCameraAsync(opts: object): Promise<{ canceled: boolean; assets?: Array<{ uri: string; width: number; height: number }> }>;
    };
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: false, quality: 0.8 });
    if (result.canceled || !result.assets?.length) return null;
    const { uri, width, height } = result.assets[0];
    return { uri, width, height };
  },
};

let _adapter: CameraAdapter = defaultAdapter;

export function setCameraAdapter(adapter: CameraAdapter): void {
  _adapter = adapter;
}

// ─── CameraService ────────────────────────────────────────────────────────────

export async function requestPermission(): Promise<PermissionStatus> {
  return _adapter.requestPermission();
}

export async function openCamera(): Promise<CaptureResult | null> {
  return _adapter.openCamera();
}
