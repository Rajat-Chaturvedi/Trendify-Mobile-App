// useTrendItemDetail — query hook
// Requirements: 4.1

import { useQuery } from '@tanstack/react-query';
import { fetchTrendItemById } from '../api/client';
import type { TrendItem } from '../types/index';

export const queryKeys = {
  trendItemDetail: (id: string) => ['trendItem', id] as const,
};

export function useTrendItemDetail(id: string) {
  return useQuery<TrendItem, Error>({
    queryKey: queryKeys.trendItemDetail(id),
    queryFn: () => fetchTrendItemById(id),
    enabled: Boolean(id),
  });
}
