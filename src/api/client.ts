// API Client — real Trendify backend
// Requirements: 3.1, 3.2, 5.2, 12.6, 12.7

import { TrendItemSchema, TrendItemPageSchema } from '../schemas/index';
import type { TrendItem, TrendItemPage, FetchTrendParams } from '../types/index';
import { apiFetch } from './http';

// ─── HTTP Adapter (injectable for tests) ─────────────────────────────────────

export interface HttpAdapter {
  get(url: string): Promise<unknown>;
}

// Default adapter uses the authenticated apiFetch
const defaultAdapter: HttpAdapter = {
  async get(path) {
    // path is already a full URL in tests; for real calls it's a relative path
    const isFullUrl = path.startsWith('http');
    let res: Response;
    if (isFullUrl) {
      res = await fetch(path);
    } else {
      res = await apiFetch(path);
    }
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
    // API expects comma-separated: categories=technology,sports
    parts.push(`categories=${params.categories.join(',')}`);
  }
  if (params.regionCode) parts.push(`regionCode=${encodeURIComponent(params.regionCode)}`);
  if (params.cursor) parts.push(`cursor=${encodeURIComponent(params.cursor)}`);
  if (params.pageSize != null) parts.push(`pageSize=${params.pageSize}`);
  return parts.length ? `?${parts.join('&')}` : '';
}

// ─── Response adapter — maps backend shape to TrendItemPage ──────────────────

function adaptResponse(raw: unknown): unknown {
  // If already in our expected shape, pass through
  if (raw && typeof raw === 'object' && 'items' in raw) return raw;

  // Backend may return array directly
  if (Array.isArray(raw)) {
    return {
      items: raw,
      totalCount: raw.length,
    };
  }

  return raw;
}

// ─── APIClient ────────────────────────────────────────────────────────────────

export async function fetchTrendItems(params: FetchTrendParams = {}): Promise<TrendItemPage> {
  const qs = buildQueryString(params);
  const raw = await _adapter.get(`/trends${qs}`);
  try {
    return TrendItemPageSchema.parse(adaptResponse(raw));
  } catch (e) {
    console.error('[fetchTrendItems] Zod parse error:', e);
    throw e;
  }
}

export async function fetchTrendItemById(id: string): Promise<TrendItem> {
  const raw = await _adapter.get(`/trends/${id}`);
  return TrendItemSchema.parse(raw);
}
