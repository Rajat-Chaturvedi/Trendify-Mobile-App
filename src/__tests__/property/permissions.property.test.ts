// Feature: trendify, Property 1: Permission denial is recorded for all permission types
// Feature: trendify, Property 2: Onboarding completion flag persists

/**
 * Validates: Requirements 1.3, 1.4
 */

import * as fc from 'fast-check';
import { recordDenial, setPermissionsAdapter, getStatus } from '../../services/permissionManager';
import {
  setStorage,
  getPermissionDenials,
  getOnboardingComplete,
  setOnboardingComplete,
} from '../../storage/mmkv';
import type { MMKVStorage } from '../../storage/mmkv';
import type { PermissionType, PermissionStatus } from '../../types/index';

// ---------------------------------------------------------------------------
// Mock MMKV storage factory
// ---------------------------------------------------------------------------

function createMockStorage(): MMKVStorage {
  const store: Record<string, string | boolean | number> = {};
  return {
    getString(key: string): string | undefined {
      const val = store[key];
      return typeof val === 'string' ? val : undefined;
    },
    set(key: string, value: string | boolean | number): void {
      store[key] = value;
    },
    getBoolean(key: string): boolean | undefined {
      const val = store[key];
      return typeof val === 'boolean' ? val : undefined;
    },
  };
}

// ---------------------------------------------------------------------------
// Property 1: Permission denial is recorded for all permission types
// Validates: Requirements 1.3
// ---------------------------------------------------------------------------

describe('Property 1: Permission denial is recorded for all permission types', () => {
  beforeEach(() => {
    setStorage(createMockStorage());
  });

  it('after recordDenial(type), getPermissionDenials() contains that type', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<PermissionType>('camera', 'location', 'notifications'),
        (type) => {
          // Reset storage for each run
          setStorage(createMockStorage());

          recordDenial(type);

          const denials = getPermissionDenials();
          return denials.includes(type);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 2: Onboarding completion flag persists
// Validates: Requirements 1.4
// ---------------------------------------------------------------------------

describe('Property 2: Onboarding completion flag persists', () => {
  beforeEach(() => {
    setStorage(createMockStorage());
  });

  it('after setOnboardingComplete(true), getOnboardingComplete() returns true', () => {
    fc.assert(
      fc.property(fc.constant(true), (value) => {
        // Reset storage for each run
        setStorage(createMockStorage());

        setOnboardingComplete(value);

        return getOnboardingComplete() === true;
      }),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 12: Permission status is accurately reflected in Profile screen
// Feature: trendify, Property 12: Permission status is accurately reflected in Profile screen
// Validates: Requirements 8.5
// ---------------------------------------------------------------------------

describe('Property 12: Permission status is accurately reflected in Profile screen', () => {
  it('getStatus returns the correct status for any permission type and status combination', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          camera: fc.constantFrom<PermissionStatus>('granted', 'denied', 'undetermined'),
          location: fc.constantFrom<PermissionStatus>('granted', 'denied', 'undetermined'),
          notifications: fc.constantFrom<PermissionStatus>('granted', 'denied', 'undetermined'),
        }),
        fc.constantFrom<PermissionType>('camera', 'location', 'notifications'),
        async (statuses, type) => {
          setStorage(createMockStorage());
          setPermissionsAdapter({
            request: async (t) => statuses[t],
            getStatus: async (t) => statuses[t],
          });

          // The status returned by getStatus must match the injected value
          const status = await getStatus(type);
          return status === statuses[type];
        },
      ),
      { numRuns: 100 },
    );
  });
});
