// Unit tests for BookmarksStore
// Requirements: 4.4, 9.1, 9.4

import { useBookmarksStore } from '../../stores/bookmarksStore';
import { setStorage, getBookmarks } from '../../storage/mmkv';
import type { MMKVStorage } from '../../storage/mmkv';
import type { TrendItem } from '../../types/index';

function createMockStorage(): MMKVStorage {
  const store: Record<string, string | boolean | number> = {};
  return {
    getString: (key) => (typeof store[key] === 'string' ? (store[key] as string) : undefined),
    set: (key, value) => { store[key] = value; },
    getBoolean: (key) => (typeof store[key] === 'boolean' ? (store[key] as boolean) : undefined),
  };
}

const ITEM_A: TrendItem = {
  id: 'item-a',
  title: 'Trend A',
  description: 'Description A',
  source: 'Source A',
  publishedAt: '2024-01-01T00:00:00.000Z',
  url: 'https://example.com/a',
  category: 'technology',
};

const ITEM_B: TrendItem = {
  id: 'item-b',
  title: 'Trend B',
  description: 'Description B',
  source: 'Source B',
  publishedAt: '2024-02-01T00:00:00.000Z',
  url: 'https://example.com/b',
  category: 'sports',
};

beforeEach(() => {
  setStorage(createMockStorage());
  useBookmarksStore.setState({ bookmarks: [] });
});

// ─── addBookmark ──────────────────────────────────────────────────────────────

describe('addBookmark', () => {
  it('adds an item to the store', () => {
    useBookmarksStore.getState().addBookmark(ITEM_A);
    expect(useBookmarksStore.getState().bookmarks).toContainEqual(ITEM_A);
  });

  it('persists the item to MMKV', () => {
    useBookmarksStore.getState().addBookmark(ITEM_A);
    expect(getBookmarks()).toContainEqual(ITEM_A);
  });

  it('does not add a duplicate', () => {
    useBookmarksStore.getState().addBookmark(ITEM_A);
    useBookmarksStore.getState().addBookmark(ITEM_A);
    expect(useBookmarksStore.getState().bookmarks).toHaveLength(1);
  });

  it('can add multiple distinct items', () => {
    useBookmarksStore.getState().addBookmark(ITEM_A);
    useBookmarksStore.getState().addBookmark(ITEM_B);
    expect(useBookmarksStore.getState().bookmarks).toHaveLength(2);
  });
});

// ─── removeBookmark ───────────────────────────────────────────────────────────

describe('removeBookmark', () => {
  it('removes the item from the store', () => {
    useBookmarksStore.getState().addBookmark(ITEM_A);
    useBookmarksStore.getState().removeBookmark(ITEM_A.id);
    expect(useBookmarksStore.getState().bookmarks).not.toContainEqual(ITEM_A);
  });

  it('removes the item from MMKV', () => {
    useBookmarksStore.getState().addBookmark(ITEM_A);
    useBookmarksStore.getState().removeBookmark(ITEM_A.id);
    expect(getBookmarks()).not.toContainEqual(ITEM_A);
  });

  it('only removes the targeted item', () => {
    useBookmarksStore.getState().addBookmark(ITEM_A);
    useBookmarksStore.getState().addBookmark(ITEM_B);
    useBookmarksStore.getState().removeBookmark(ITEM_A.id);
    expect(useBookmarksStore.getState().bookmarks).toContainEqual(ITEM_B);
    expect(useBookmarksStore.getState().bookmarks).toHaveLength(1);
  });

  it('is a no-op when item is not bookmarked', () => {
    useBookmarksStore.getState().addBookmark(ITEM_A);
    useBookmarksStore.getState().removeBookmark('non-existent-id');
    expect(useBookmarksStore.getState().bookmarks).toHaveLength(1);
  });
});

// ─── isBookmarked ─────────────────────────────────────────────────────────────

describe('isBookmarked', () => {
  it('returns false when item is not bookmarked', () => {
    expect(useBookmarksStore.getState().isBookmarked(ITEM_A.id)).toBe(false);
  });

  it('returns true after addBookmark', () => {
    useBookmarksStore.getState().addBookmark(ITEM_A);
    expect(useBookmarksStore.getState().isBookmarked(ITEM_A.id)).toBe(true);
  });

  it('returns false after removeBookmark', () => {
    useBookmarksStore.getState().addBookmark(ITEM_A);
    useBookmarksStore.getState().removeBookmark(ITEM_A.id);
    expect(useBookmarksStore.getState().isBookmarked(ITEM_A.id)).toBe(false);
  });
});
