// Unit tests for feed and detail API client functions
// Requirements: 3.1, 3.2, 3.5, 4.1

import { fetchTrendItems, fetchTrendItemById, setHttpAdapter } from '../../api/client';
import type { TrendItemPage, TrendItem } from '../../types/index';

const SAMPLE_PAGE: TrendItemPage = {
  items: [
    {
      id: '1',
      title: 'Test Trend',
      description: 'A test description',
      source: 'TestSource',
      publishedAt: '2024-01-01T00:00:00.000Z',
      url: 'https://example.com/1',
      category: 'technology',
    },
  ],
  totalCount: 1,
};

const SAMPLE_ITEM: TrendItem = SAMPLE_PAGE.items[0];

beforeEach(() => {
  setHttpAdapter({ get: async () => SAMPLE_PAGE });
});

// ─── fetchTrendItems ──────────────────────────────────────────────────────────

describe('fetchTrendItems', () => {
  it('returns a TrendItemPage on success', async () => {
    const page = await fetchTrendItems({});
    expect(page.items).toHaveLength(1);
    expect(page.totalCount).toBe(1);
  });

  it('includes categories in the request URL', async () => {
    let capturedUrl = '';
    setHttpAdapter({
      get: async (url) => { capturedUrl = url; return SAMPLE_PAGE; },
    });
    await fetchTrendItems({ categories: ['technology', 'sports'] });
    expect(capturedUrl).toContain('categories=');
    expect(capturedUrl).toContain('technology');
    expect(capturedUrl).toContain('sports');
  });

  it('includes regionCode in the request URL', async () => {
    let capturedUrl = '';
    setHttpAdapter({
      get: async (url) => { capturedUrl = url; return SAMPLE_PAGE; },
    });
    await fetchTrendItems({ regionCode: 'US' });
    expect(capturedUrl).toContain('regionCode=US');
  });

  it('throws on network error', async () => {
    setHttpAdapter({ get: async () => { throw new Error('Network error'); } });
    await expect(fetchTrendItems({})).rejects.toThrow('Network error');
  });

  it('throws on Zod parse failure', async () => {
    setHttpAdapter({ get: async () => ({ invalid: true }) });
    await expect(fetchTrendItems({})).rejects.toThrow();
  });
});

// ─── fetchTrendItemById ───────────────────────────────────────────────────────

describe('fetchTrendItemById', () => {
  it('returns a TrendItem on success', async () => {
    setHttpAdapter({ get: async () => SAMPLE_ITEM });
    const item = await fetchTrendItemById('1');
    expect(item.id).toBe('1');
    expect(item.title).toBe('Test Trend');
  });

  it('throws on network error', async () => {
    setHttpAdapter({ get: async () => { throw new Error('Not found'); } });
    await expect(fetchTrendItemById('999')).rejects.toThrow('Not found');
  });
});
