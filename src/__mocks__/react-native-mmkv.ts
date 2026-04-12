// Manual mock for react-native-mmkv
// Provides an in-memory MMKV implementation for Jest tests.
// Tests that need a fresh store should call setStorage() from src/storage/mmkv.ts.

const store: Record<string, string | boolean | number> = {};

export class MMKV {
  getString(key: string): string | undefined {
    const v = store[key];
    return typeof v === 'string' ? v : undefined;
  }

  set(key: string, value: string | boolean | number): void {
    store[key] = value;
  }

  getBoolean(key: string): boolean | undefined {
    const v = store[key];
    return typeof v === 'boolean' ? v : undefined;
  }
}
