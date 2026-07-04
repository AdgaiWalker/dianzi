import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api, initApi } from '../src/services/api';

const fetchMock = vi.fn();

function jsonResponse(payload: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(payload), {
    status: init.status ?? 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function analyticsEvents() {
  return fetchMock.mock.calls
    .filter(([url]) => String(url).includes('/api/analytics/events'))
    .map(([, init]) => JSON.parse(String((init as RequestInit).body)).event);
}

describe('frontlife analytics integration', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    initApi(() => 'token');
  });

  it('tracks the campus behavior event whitelist from API workflows', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('/api/analytics/events')) return Promise.resolve(jsonResponse({ ok: true, data: {} }));
      if (url.includes('/api/campus/search?q=empty')) {
        return Promise.resolve(jsonResponse({ articles: [], posts: [], spaces: [], matchStatus: 'none' }));
      }
      if (url.includes('/api/campus/search')) {
        return Promise.resolve(jsonResponse({ articles: [{ id: 'a1' }], posts: [], spaces: [], matchStatus: 'partial' }));
      }
      if (url.includes('/api/ai-gateway/chat')) {
        return Promise.resolve(jsonResponse({ data: { mode: 'demo', fallbackReason: 'missing_key', choices: [{ message: { content: 'fallback' } }] } }));
      }
      if (url.includes('/api/campus/spaces/food/posts')) {
        return Promise.resolve(jsonResponse({ posts: [] }));
      }
      if (url.includes('/api/campus/spaces/food')) {
        return Promise.resolve(jsonResponse({ space: { id: 'food' }, articles: [] }));
      }
      if (url.includes('/api/campus/articles/article-1/helpful')) {
        return Promise.resolve(jsonResponse({ articleId: 'article-1', helpfulCount: 2, confirmedAt: '2026-05-16T00:00:00.000Z' }));
      }
      if (url.includes('/api/campus/articles/article-1/changed')) {
        return Promise.resolve(jsonResponse({ articleId: 'article-1', changedCount: 1, feedback: { id: 'f1', articleId: 'article-1', note: 'changed', createdAt: '2026-05-16T00:00:00.000Z' } }));
      }
      if (url.includes('/api/campus/articles/article-1')) {
        return Promise.resolve(jsonResponse({ article: { id: 'article-1', space: { id: 'food' } }, previousArticleId: null, nextArticleId: null }));
      }
      if (url.includes('/api/campus/posts/post-1/replies')) {
        return Promise.resolve(jsonResponse({ reply: { id: 'reply-1' } }));
      }
      if (url.includes('/api/campus/posts')) {
        return Promise.resolve(jsonResponse({ post: { id: 'post-1' } }));
      }
      if (url.includes('/api/campus/favorites')) {
        return Promise.resolve(jsonResponse({ favorite: { id: 'favorite-1' } }));
      }
      return Promise.resolve(jsonResponse({}));
    });

    await api.search('食堂');
    await api.search('empty');
    await api.searchAiStream('打印店在哪', () => undefined);
    await api.getSpace('food');
    await api.getArticle('article-1');
    await api.markArticleHelpful('article-1');
    await api.markArticleChanged('article-1', 'changed');
    await api.createPost({ spaceId: 'food', content: '求助' });
    await api.replyToPost('post-1', '回复');
    await api.favorite({ targetType: 'article', targetId: 'article-1' });

    expect(new Set(analyticsEvents())).toEqual(new Set([
      'campus_search',
      'campus_search_no_result',
      'campus_ai_fallback',
      'campus_space_visit',
      'campus_article_read',
      'campus_feedback_helpful',
      'campus_feedback_changed',
      'campus_post_created',
      'campus_reply_created',
      'campus_favorite',
    ]));
  });
});
