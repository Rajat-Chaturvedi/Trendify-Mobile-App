// Bookmarks Store — syncs with real API
// Requirements: 4.4, 9.1, 9.4

import { createStore } from 'zustand/vanilla';
import type { TrendItem } from '../types/index';
import { getBookmarks, setBookmarks } from '../storage/mmkv';

interface BookmarksStore {
  bookmarks: TrendItem[];
  addBookmark(item: TrendItem): void;
  removeBookmark(id: string): void;
  isBookmarked(id: string): boolean;
  syncFromApi(): Promise<void>;
}

async function apiAddBookmark(id: string): Promise<void> {
  try {
    const { apiFetch } = await import('../api/http');
    await apiFetch(`/bookmarks/${id}`, { method: 'POST' });
  } catch { /* offline — local store already updated */ }
}

async function apiRemoveBookmark(id: string): Promise<void> {
  try {
    const { apiFetch } = await import('../api/http');
    await apiFetch(`/bookmarks/${id}`, { method: 'DELETE' });
  } catch { /* offline */ }
}

export const useBookmarksStore = createStore<BookmarksStore>((set, get) => ({
  bookmarks: getBookmarks(),

  addBookmark(item) {
    if (get().isBookmarked(item.id)) return;
    const updated = [...get().bookmarks, item];
    set({ bookmarks: updated });
    setBookmarks(updated);
    apiAddBookmark(item.id);
  },

  removeBookmark(id) {
    const updated = get().bookmarks.filter((b) => b.id !== id);
    set({ bookmarks: updated });
    setBookmarks(updated);
    apiRemoveBookmark(id);
  },

  isBookmarked(id) {
    return get().bookmarks.some((b) => b.id === id);
  },

  async syncFromApi() {
    try {
      const { apiFetch } = await import('../api/http');
      const res = await apiFetch('/bookmarks');
      if (!res.ok) return;
      const data = (await res.json()) as { items?: TrendItem[] } | TrendItem[];
      const items = Array.isArray(data) ? data : (data.items ?? []);
      set({ bookmarks: items });
      setBookmarks(items);
    } catch { /* offline — use local cache */ }
  },
}));
