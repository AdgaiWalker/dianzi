import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { trackCampusEvent } from '../src/services/analyticsService';

describe('trackCampusEvent', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('posts campus analytics events without blocking callers', () => {
    trackCampusEvent('campus_search', { query: '食堂' });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/analytics/events',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          site: 'cn',
          event: 'campus_search',
          metadata: { query: '食堂' },
        }),
      }),
    );
  });

  it('posts campus-to-compass click events from campus conversion links', () => {
    trackCampusEvent('campus_to_compass_click', { source: 'search_ai_card' });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/analytics/events',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          site: 'cn',
          event: 'campus_to_compass_click',
          metadata: { source: 'search_ai_card' },
        }),
      }),
    );
  });

  it('ignores non-campus events', () => {
    trackCampusEvent('compass_search' as never, { query: 'AI' });

    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});
