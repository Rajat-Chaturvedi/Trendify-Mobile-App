// Biometric Service
// Requirements: 2.5, 1.5

import type { BiometricResult } from '../types/index';

// ─── Adapter ──────────────────────────────────────────────────────────────────

export interface BiometricAdapter {
  isAvailable(): Promise<boolean>;
  authenticate(reason: string): Promise<BiometricResult>;
}

const defaultAdapter: BiometricAdapter = {
  async isAvailable() {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const LocalAuth = require('expo-local-authentication') as {
        hasHardwareAsync(): Promise<boolean>;
        isEnrolledAsync(): Promise<boolean>;
      };
      const [hasHardware, isEnrolled] = await Promise.all([
        LocalAuth.hasHardwareAsync(),
        LocalAuth.isEnrolledAsync(),
      ]);
      return hasHardware && isEnrolled;
    } catch { return false; }
  },

  async authenticate(reason) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const LocalAuth = require('expo-local-authentication') as {
        authenticateAsync(opts: { promptMessage: string }): Promise<{ success: boolean; error?: string }>;
      };
      const result = await LocalAuth.authenticateAsync({ promptMessage: reason });
      return { success: result.success, error: result.error };
    } catch { return { success: false, error: 'Biometrics unavailable' }; }
  },
};

let _adapter: BiometricAdapter = defaultAdapter;

export function setBiometricAdapter(adapter: BiometricAdapter): void {
  _adapter = adapter;
}

// ─── BiometricService ─────────────────────────────────────────────────────────

export async function isAvailable(): Promise<boolean> {
  return _adapter.isAvailable();
}

export async function authenticate(reason = 'Authenticate to continue'): Promise<BiometricResult> {
  return _adapter.authenticate(reason);
}

export async function enableBiometricLogin(): Promise<void> {
  // Preference persistence is handled by PreferencesStore; this is a no-op hook
}

export async function disableBiometricLogin(): Promise<void> {
  // Preference persistence is handled by PreferencesStore; this is a no-op hook
}
