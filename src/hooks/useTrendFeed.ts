// useTrendFeed — infinite query hook
// Requirements: 3.1, 3.2, 3.3, 3.6

import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchTrendItems } from '../api/client';
import { usePreferencesStore } from '../stores/preferencesStore';
import type { FetchTrendParams, TrendItemPage } from '../types/index';

export const queryKeys = {
  trendItems: (params: FetchTrendParams) => ['trendItems', params] as const,
};

export function useTrendFeed(extraParams: Omit<FetchTrendParams, 'categories' | 'cursor'> = {}) {
  const categories = usePreferencesStore.getState().categories;

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
