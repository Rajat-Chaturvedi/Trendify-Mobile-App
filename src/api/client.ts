// API Client
// Requirements: 3.1, 3.2, 5.2, 12.6, 12.7

import { TrendItemSchema, TrendItemPageSchema } from '../schemas/index';
import type { TrendItem, TrendItemPage, FetchTrendParams } from '../types/index';

const BASE_URL = 'https://jsonplaceholder.typicode.com';

// ─── HTTP Adapter (injectable for tests) ─────────────────────────────────────

export interface HttpAdapter {
  get(url: string): Promise<unknown>;
}

const defaultAdapter: HttpAdapter = {
  async get(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return res.json();
  },
};

let _adapter: HttpAdapter = defaultAdapter;

export function setHttpAdapter(adapter: HttpAdapter): void {
  _adapter = adapter;
}

export function getHttpAdapter(): HttpAdapter {
  return _adapter;
}

// ─── Query string builder ─────────────────────────────────────────────────────

function buildQueryString(params: FetchTrendParams): string {
  const parts: string[] = [];
  if (params.categories?.length) {
    parts.push(`categories=${params.categories.map(encodeURIComponent).join(',')}`);
  }
  if (params.regionCode) parts.push(`regionCode=${encodeURIComponent(params.regionCode)}`);
  if (params.cursor) parts.push(`cursor=${encodeURIComponent(params.cursor)}`);
  if (params.pageSize != null) parts.push(`pageSize=${params.pageSize}`);
  return parts.length ? `?${parts.join('&')}` : '';
}

// ─── APIClient ────────────────────────────────────────────────────────────────

export async function fetchTrendItems(params: FetchTrendParams = {}): Promise<TrendItemPage> {
  const qs = buildQueryString(params);
  const raw = await _adapter.get(`${BASE_URL}/posts${qs}`);

  // JSONPlaceholder returns an array; adapt to TrendItemPage shape for validation
  const adapted = Array.isArray(raw)
    ? {
        items: (raw as Array<Record<string, unknown>>).map((p) => ({
          id: String(p['id']),
          title: String(p['title']),
          description: String(p['body']),
          source: 'JSONPlaceholder',
          publishedAt: new Date().toISOString(),
          url: `https://jsonplaceholder.typicode.com/posts/${p['id']}`,
          category: 'technology' as const,
        })),
        totalCount: (raw as unknown[]).length,
      }
    : raw;

  return TrendItemPageSchema.parse(adapted);
}

export async function fetchTrendItemById(id: string): Promise<TrendItem> {
  const raw = await _adapter.get(`${BASE_URL}/posts/${id}`);

  const p = raw as Record<string, unknown>;
  const adapted = {
    id: String(p['id']),
    title: String(p['title']),
    description: String(p['body']),
    source: 'JSONPlaceholder',
    publishedAt: new Date().toISOString(),
    url: `https://jsonplaceholder.typicode.com/posts/${p['id']}`,
    category: 'technology' as const,
  };

  return TrendItemSchema.parse(adapted);
}
