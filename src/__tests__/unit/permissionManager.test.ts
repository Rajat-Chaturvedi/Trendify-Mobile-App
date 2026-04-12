// Unit tests for PermissionManager
// Requirements: 1.2, 1.3

import {
  requestAll,
  getStatus,
  recordDenial,
  setPermissionsAdapter,
  getPermissionsAdapter,
  type PermissionsAdapter,
} from '../../services/permissionManager';
import { setStorage } from '../../storage/mmkv';
import type { PermissionType, PermissionStatus } from '../../types/index';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeMockStorage(initial: Record<string, string> = {}) {
  const store: Record<string, string> = { ...initial };
  return {
    getString: (key: string) => store[key],
    set: (key: string, value: string | boolean | number) => {
      store[key] = String(value);
    },
    getBoolean: (key: string) => (store[key] === 'true' ? true : store[key] === 'false' ? false : undefined),
    _store: store,
  };
}

function makeAdapter(statusMap: Record<PermissionType, PermissionStatus>): PermissionsAdapter {
  return {
    request: jest.fn(async (type: PermissionType) => statusMap[type]),
    getStatus: jest.fn(async (type: PermissionType) => statusMap[type]),
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('PermissionManager', () => {
  let mockStorage: ReturnType<typeof makeMockStorage>;

  beforeEach(() => {
    mockStorage = makeMockStorage();
    setStorage(mockStorage);
    // Reset to a fresh adapter each test
    setPermissionsAdapter(makeAdapter({ camera: 'undetermined', location: 'undetermined', notifications: 'undetermined' }));
  });

  // ── requestAll ──────────────────────────────────────────────────────────────

  describe('requestAll', () => {
    it('returns granted for all when adapter grants all', async () => {
      setPermissionsAdapter(makeAdapter({ camera: 'granted', location: 'granted', notifications: 'granted' }));
      const result = await requestAll();
      expect(result).toEqual({ camera: 'granted', location: 'granted', notifications: 'granted' });
    });

    it('returns denied for all when adapter denies all', async () => {
      setPermissionsAdapter(makeAdapter({ camera: 'denied', location: 'denied', notifications: 'denied' }));
      const result = await requestAll();
      expect(result).toEqual({ camera: 'denied', location: 'denied', notifications: 'denied' });
    });

    it('returns mixed statuses correctly', async () => {
      setPermissionsAdapter(makeAdapter({ camera: 'granted', location: 'denied', notifications: 'undetermined' }));
      const result = await requestAll();
      expect(result).toEqual({ camera: 'granted', location: 'denied', notifications: 'undetermined' });
    });

    it('calls request on the adapter for each permission type', async () => {
      const adapter = makeAdapter({ camera: 'granted', location: 'granted', notifications: 'granted' });
      setPermissionsAdapter(adapter);
      await requestAll();
      expect(adapter.request).toHaveBeenCalledWith('camera');
      expect(adapter.request).toHaveBeenCalledWith('location');
      expect(adapter.request).toHaveBeenCalledWith('notifications');
    });
  });

  // ── getStatus ───────────────────────────────────────────────────────────────

  describe('getStatus', () => {
    it('returns the status from the adapter for camera', async () => {
      setPermissionsAdapter(makeAdapter({ camera: 'granted', location: 'undetermined', notifications: 'undetermined' }));
      expect(await getStatus('camera')).toBe('granted');
    });

    it('returns the status from the adapter for location', async () => {
      setPermissionsAdapter(makeAdapter({ camera: 'undetermined', location: 'denied', notifications: 'undetermined' }));
      expect(await getStatus('location')).toBe('denied');
    });

    it('returns the status from the adapter for notifications', async () => {
      setPermissionsAdapter(makeAdapter({ camera: 'undetermined', location: 'undetermined', notifications: 'granted' }));
      expect(await getStatus('notifications')).toBe('granted');
    });
  });

  // ── recordDenial ─────────────────────────────────────────────────────────────

  describe('recordDenial', () => {
    it('adds a type to an empty denial list', () => {
      recordDenial('camera');
      expect(mockStorage.getString('permission_denials')).toBe(JSON.stringify(['camera']));
    });

    it('does not duplicate an already-recorded denial', () => {
      recordDenial('camera');
      recordDenial('camera');
      expect(JSON.parse(mockStorage.getString('permission_denials')!)).toEqual(['camera']);
    });

    it('accumulates multiple distinct denials', () => {
      recordDenial('camera');
      recordDenial('location');
      recordDenial('notifications');
      expect(JSON.parse(mockStorage.getString('permission_denials')!)).toEqual([
        'camera',
        'location',
        'notifications',
      ]);
    });

    it('preserves existing denials when adding a new one', () => {
      mockStorage.set('permission_denials', JSON.stringify(['location']));
      recordDenial('camera');
      expect(JSON.parse(mockStorage.getString('permission_denials')!)).toEqual(['location', 'camera']);
    });
  });

  // ── adapter injection ────────────────────────────────────────────────────────

  describe('adapter injection', () => {
    it('getPermissionsAdapter returns the adapter set by setPermissionsAdapter', () => {
      const adapter = makeAdapter({ camera: 'granted', location: 'granted', notifications: 'granted' });
      setPermissionsAdapter(adapter);
      expect(getPermissionsAdapter()).toBe(adapter);
    });
  });
});
