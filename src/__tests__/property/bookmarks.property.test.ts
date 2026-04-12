// Feature: trendify, Property 8: Bookmark round-trip
// Feature: trendify, Property 9: Bookmark removal clears storage

/**
 * Validates: Requirements 4.4, 9.1, 9.4
 */

import * as fc from 'fast-check';
import { useBookmarksStore } from '../../stores/bookmarksStore';
import { setStorage, getBookmarks } from '../../storage/mmkv';
import type { MMKVStorage } from '../../storage/mmkv';
import type { Category, TrendItem } from '../../types/index';

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
// Arbitraries
// ---------------------------------------------------------------------------

const categoryArb = fc.constantFrom<Category>(
  'technology',
  'sports',
  'finance',
  'entertainment',
  'health',
  'science',
);

const isoDatetimeArb: fc.Arbitrary<string> = fc
  .date({ min: new Date('2000-01-01'), max: new Date('2099-12-31') })
  .map((d) => d.toISOString());

const urlArb: fc.Arbitrary<string> = fc
  .record({
    host: fc.domain(),
    path: fc.stringOf(fc.char().filter((c) => /[a-z0-9\-_]/.test(c)), {
      minLength: 0,
      maxLength: 20,
    }),
  })
  .map(({ host, path }) => `https://${host}/${path}`);

const trendItemArb: fc.Arbitrary<TrendItem> = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1 }),
  description: fc.string(),
  source: fc.string({ minLength: 1 }),
  publishedAt: isoDatetimeArb,
  url: urlArb,
  category: categoryArb,
  imageUrl: fc.option(urlArb, { nil: undefined }),
  regionCode: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resetStore(): void {
  useBookmarksStore.setState({ bookmarks: [] });
}

// ---------------------------------------------------------------------------
// Property 8: Bookmark round-trip
// Validates: Requirements 4.4, 9.1
// ---------------------------------------------------------------------------

describe('Property 8: Bookmark round-trip', () => {
  beforeEach(() => {
    setStorage(createMockStorage());
    resetStore();
  });

  it('after addBookmark(item), the store contains the item and isBookmarked returns true', () => {
    fc.assert(
      fc.property(trendItemArb, (item) => {
        setStorage(createMockStorage());
        resetStore();

        const { addBookmark, isBookmarked } = useBookmarksStore.getState();
        addBookmark(item);

        const { bookmarks } = useBookmarksStore.getState();
        const foundInStore = bookmarks.some((b) => b.id === item.id);
        const bookmarkedFlag = isBookmarked(item.id);

        return foundInStore && bookmarkedFlag;
      }),
      { numRuns: 100 },
    );
  });

  it('after addBookmark(item), the item is persisted to MMKV storage', () => {
    fc.assert(
      fc.property(trendItemArb, (item) => {
        const mockStorage = createMockStorage();
        setStorage(mockStorage);
        resetStore();

        const { addBookmark } = useBookmarksStore.getState();
        addBookmark(item);

        const persisted = getBookmarks();
        return persisted.some((b) => b.id === item.id);
      }),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 9: Bookmark removal clears storage
// Validates: Requirements 4.4, 9.4
// ---------------------------------------------------------------------------

describe('Property 9: Bookmark removal clears storage', () => {
  beforeEach(() => {
    setStorage(createMockStorage());
    resetStore();
  });

  it('after removeBookmark(id), the store no longer contains the item and isBookmarked returns false', () => {
    fc.assert(
      fc.property(trendItemArb, (item) => {
        setStorage(createMockStorage());
        resetStore();

        const { addBookmark, removeBookmark, isBookmarked } = useBookmarksStore.getState();
        addBookmark(item);
        removeBookmark(item.id);

        const { bookmarks } = useBookmarksStore.getState();
        const notInStore = !bookmarks.some((b) => b.id === item.id);
        const notBookmarked = !isBookmarked(item.id);

        return notInStore && notBookmarked;
      }),
      { numRuns: 100 },
    );
  });

  it('after removeBookmark(id), the item is no longer in MMKV storage', () => {
    fc.assert(
      fc.property(trendItemArb, (item) => {
        const mockStorage = createMockStorage();
        setStorage(mockStorage);
        resetStore();

        const { addBookmark, removeBookmark } = useBookmarksStore.getState();
        addBookmark(item);
        removeBookmark(item.id);

        const persisted = getBookmarks();
        return !persisted.some((b) => b.id === item.id);
      }),
      { numRuns: 100 },
    );
  });
});
