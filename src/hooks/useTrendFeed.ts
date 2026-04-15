// useTrendFeed — infinite query hook
// Requirements: 3.1, 3.2, 3.3, 3.6

import { useState, useEffect } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchTrendItems } from '../api/client';
import { usePreferencesStore } from '../stores/preferencesStore';
import type { FetchTrendParams, TrendItemPage, Category } from '../types/index';

export const queryKeys = {
  trendItems: (params: FetchTrendParams) => ['trendItems', params] as const,
};

// Accept full FetchTrendParams minus cursor — categories can be overridden by caller
export function useTrendFeed(extraParams: Omit<FetchTrendParams, 'cursor'> = {}) {
  // Subscribe to stored categories so the query key updates when preferences change
  const [storedCategories, setStoredCategories] = useState<Category[]>(
    () => usePreferencesStore.getState().categories,
  );

  useEffect(() => {
    return usePreferencesStore.subscribe((state) => {
      setStoredCategories(state.categories);
    });
  }, []);

  // Caller-provided categories take precedence over stored preferences.
  // An explicit empty array means "no filter" (all categories), so we only
  // fall back to stored categories when the caller passes undefined.
  const categories = extraParams.categories !== undefined
    ? extraParams.categories
    : storedCategories;

  return useInfiniteQuery<TrendItemPage, Error>({
    queryKey: queryKeys.trendItems({ ...extraParams, categories }),
    queryFn: ({ pageParam }) =>
      fetchTrendItems({
        ...extraParams,
        categories,
        cursor: pageParam as string | undefined,
      }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}
