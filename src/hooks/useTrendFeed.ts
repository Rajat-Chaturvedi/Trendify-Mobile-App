// useTrendFeed — infinite query hook
// Requirements: 3.1, 3.2, 3.3, 3.6

import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchTrendItems } from '../api/client';
import { usePreferencesStore } from '../stores/preferencesStore';
import type { FetchTrendParams, TrendItemPage } from '../types/index';

export const queryKeys = {
  trendItems: (params: FetchTrendParams) => ['trendItems', params] as const,
};

// Accept full FetchTrendParams minus cursor — categories can be overridden by caller
export function useTrendFeed(extraParams: Omit<FetchTrendParams, 'cursor'> = {}) {
  const storedCategories = usePreferencesStore.getState().categories;
  // Caller-provided categories take precedence over stored preferences
  const categories = extraParams.categories ?? storedCategories;

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
