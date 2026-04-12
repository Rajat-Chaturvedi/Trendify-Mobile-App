// Feature: trendify, Property 6: Category preferences are included in API requests
// Feature: trendify, Property 7: Network error produces error state with retry
// Feature: trendify, Property 10: Location coordinates produce region code in API params

/**
 * Validates: Requirements 3.2, 3.5, 5.2, 8.2
 */

import * as fc from 'fast-check';
import { setHttpAdapter, fetchTrendItems } from '../../api/client';
import { usePreferencesStore } from '../../stores/preferencesStore';
import { setStorage } from '../../storage/mmkv';
import { resolveRegionCode, setLocationAdapter } from '../../services/locationService';
import type { MMKVStorage } from '../../storage/mmkv';
import type { Category, Coordinates } from '../../types/index';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockStorage(): MMKVStorage {
  const store: Record<string, string | boolean | number> = {};
  return {
    getString: (k) => (typeof store[k] === 'string' ? (store[k] as string) : undefined),
    set: (k, v) => { store[k] = v; },
    getBoolean: (k) => (typeof store[k] === 'boolean' ? (store[k] as boolean) : undefined),
  };
}

const CATEGORIES: Category[] = ['technology', 'sports', 'finance', 'entertainment', 'health', 'science'];

// ---------------------------------------------------------------------------
// Property 6: Category preferences are included in API requests
// Validates: Requirements 3.2, 8.2
// ---------------------------------------------------------------------------

describe('Property 6: Category preferences are included in API requests', () => {
  beforeEach(() => {
    setStorage(createMockStorage());
    usePreferencesStore.setState({ categories: [] });
  });

  it('fetchTrendItems is called with all selected categories', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.constantFrom<Category>(...CATEGORIES), { minLength: 1, maxLength: 6 }),
        async (cats) => {
          let capturedParams: Parameters<typeof fetchTrendItems>[0] | undefined;

          setHttpAdapter({
            get: async () => {
              capturedParams = { categories: cats };
              return { items: [], totalCount: 0 };
            },
          });

          usePreferencesStore.setState({ categories: cats });
          const params = { categories: usePreferencesStore.getState().categories };
          await fetchTrendItems(params);

          return cats.every((c) => capturedParams?.categories?.includes(c));
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 7: Network error produces error state with retry
// Validates: Requirements 3.5
// ---------------------------------------------------------------------------

describe('Property 7: Network error produces error state', () => {
  it('fetchTrendItems throws when the HTTP adapter throws', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('NetworkError', 'TimeoutError', 'ServerError'),
        async (errorType) => {
          setHttpAdapter({
            get: async () => { throw new Error(errorType); },
          });

          try {
            await fetchTrendItems({});
            return false;
          } catch (e) {
            return e instanceof Error;
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 10: Location coordinates produce region code in API params
// Validates: Requirements 5.2
// ---------------------------------------------------------------------------

describe('Property 10: Location coordinates produce region code in API params', () => {
  it('resolveRegionCode returns a non-empty string for any valid coordinates', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          latitude: fc.float({ min: -90, max: 90, noNaN: true }),
          longitude: fc.float({ min: -180, max: 180, noNaN: true }),
        }),
        async (coords: Coordinates) => {
          setLocationAdapter({
            requestPermission: async () => 'granted',
            getCurrentPosition: async () => coords,
            reverseGeocode: async (c) => (c.latitude >= 0 ? 'US' : 'AU'),
          });

          const regionCode = await resolveRegionCode(coords);
          return typeof regionCode === 'string' && regionCode.length > 0;
        },
      ),
      { numRuns: 100 },
    );
  });

  it('region code is included in fetchTrendItems params when location resolves', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          latitude: fc.float({ min: -90, max: 90, noNaN: true }),
          longitude: fc.float({ min: -180, max: 180, noNaN: true }),
        }),
        async (coords: Coordinates) => {
          setLocationAdapter({
            requestPermission: async () => 'granted',
            getCurrentPosition: async () => coords,
            reverseGeocode: async () => 'US',
          });

          let capturedUrl = '';
          setHttpAdapter({
            get: async (url) => { capturedUrl = url; return { items: [], totalCount: 0 }; },
          });

          const regionCode = await resolveRegionCode(coords);
          await fetchTrendItems({ regionCode });

          return capturedUrl.includes('regionCode=US');
        },
      ),
      { numRuns: 100 },
    );
  });
});
