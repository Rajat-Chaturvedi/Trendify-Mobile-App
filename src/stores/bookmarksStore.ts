// Bookmarks Store
// Requirements: 4.4, 9.1, 9.4

import { createStore } from 'zustand/vanilla';
import type { TrendItem } from '../types/index';
import { getBookmarks, setBookmarks } from '../storage/mmkv';

interface BookmarksStore {
  bookmarks: TrendItem[];
  addBookmark(item: TrendItem): void;
  removeBookmark(id: string): void;
  isBookmarked(id: string): boolean;
}

export const useBookmarksStore = createStore<BookmarksStore>((set, get) => ({
  bookmarks: getBookmarks(),

  addBookmark(item) {
    if (get().isBookmarked(item.id)) return;
    const updated = [...get().bookmarks, item];
    set({ bookmarks: updated });
    setBookmarks(updated);
  },

  removeBookmark(id) {
    const updated = get().bookmarks.filter((b) => b.id !== id);
    set({ bookmarks: updated });
    setBookmarks(updated);
  },

  isBookmarked(id) {
    return get().bookmarks.some((b) => b.id === id);
  },
}));
