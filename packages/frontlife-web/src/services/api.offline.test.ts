import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from './api';

describe('campus public content offline fallback', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('network blocked')));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns local spaces and feed when the API cannot be reached', async () => {
    const [spaces, feed] = await Promise.all([
      api.listSpaces(),
      api.getFeed(1, 6),
    ]);

    expect(spaces.spaces.length).toBeGreaterThanOrEqual(4);
    expect(feed.items.length).toBeGreaterThanOrEqual(3);
    expect(feed.hasMore).toBe(false);
    expect(spaces.spaces.map((item) => item.id)).toContain('food');
    expect(JSON.stringify({ spaces, feed })).not.toMatch(/picsum|fastly\.picsum|fonts\.loli|fonts\.googleapis/);
  });
});
