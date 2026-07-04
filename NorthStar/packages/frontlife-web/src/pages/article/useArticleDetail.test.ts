import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/services/api';
import { useArticleDetail } from './useArticleDetail';

vi.mock('@/services/api', () => ({
  api: {
    getArticle: vi.fn(),
    getSpace: vi.fn(),
  },
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const article = {
  id: 'a1',
  title: '食堂时间',
  summary: '',
  content: '## 标题',
  helpfulCount: 1,
  changedCount: 0,
  changeNotes: [],
  confirmedAt: null,
  updatedAt: '2026-01-01T00:00:00.000Z',
  author: { id: 'u1', name: '张同学' },
  space: { id: 'food', title: '食堂' },
};

describe('useArticleDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads article details and same-space articles', async () => {
    vi.mocked(api.getArticle).mockResolvedValue({ article, previousArticleId: 'prev', nextArticleId: 'next' } as any);
    vi.mocked(api.getSpace).mockResolvedValue({ articles: [{ id: 'a1', title: '食堂时间' }] } as any);

    const { result } = renderHook(() => useArticleDetail('a1', 0));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.article?.id).toBe('a1');
    expect(result.current.previousArticleId).toBe('prev');
    expect(result.current.nextArticleId).toBe('next');
    expect(result.current.spaceArticles).toHaveLength(1);
    expect(result.current.error).toBe('');
  });

  it('returns the fallback error when loading fails', async () => {
    vi.mocked(api.getArticle).mockRejectedValue(new Error('接口失败'));

    const { result } = renderHook(() => useArticleDetail('missing', 0));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('接口失败');
    expect(result.current.article).toBeNull();
  });

  it('ignores article results after unmount', async () => {
    const pending = deferred<any>();
    vi.mocked(api.getArticle).mockReturnValue(pending.promise);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const { unmount } = renderHook(() => useArticleDetail('a1', 0));
    unmount();

    await act(async () => {
      pending.resolve({ article, previousArticleId: null, nextArticleId: null });
      await pending.promise;
    });

    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
