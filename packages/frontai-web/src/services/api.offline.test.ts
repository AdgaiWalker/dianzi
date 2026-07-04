import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { compassApi } from './api';

describe('compass public content offline fallback', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        getItem: vi.fn(() => null),
        removeItem: vi.fn(),
      },
    });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('network blocked')));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns local public content when the API cannot be reached', async () => {
    const [tools, topics, articles] = await Promise.all([
      compassApi.listTools(),
      compassApi.listTopics(),
      compassApi.listArticles(),
    ]);

    expect(tools.items.length).toBeGreaterThanOrEqual(3);
    expect(topics.items.length).toBeGreaterThanOrEqual(2);
    expect(articles.items.length).toBeGreaterThanOrEqual(2);
    expect(tools.items.map((item) => item.name)).toContain('Cursor');
    expect(JSON.stringify({ tools, topics, articles })).not.toMatch(/picsum|fastly\.picsum|fonts\.googleapis/);
  });
});
