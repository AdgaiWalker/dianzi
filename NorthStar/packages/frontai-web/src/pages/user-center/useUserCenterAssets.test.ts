import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { compassApi } from '@/services/api';
import { useUserCenterAssets } from './useUserCenterAssets';

vi.mock('@/services/api', () => ({
  compassApi: {
    listSolutions: vi.fn(),
    listTools: vi.fn(),
    listFavorites: vi.fn(),
    listArticles: vi.fn(),
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

const solution = {
  id: 's1',
  title: '方案',
  targetGoal: '目标',
  toolIds: ['t1'],
  content: '建议',
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('useUserCenterAssets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads solutions, tools, articles, and favorites', async () => {
    const setFavoriteToolIds = vi.fn();
    vi.mocked(compassApi.listSolutions).mockResolvedValue({ items: [solution] } as never);
    vi.mocked(compassApi.listTools).mockResolvedValue({ items: [{ id: 't1', name: '工具' }] } as never);
    vi.mocked(compassApi.listFavorites).mockResolvedValue({
      items: [
        { targetType: 'tool', targetId: 't1' },
        { targetType: 'article', targetId: 'a1' },
      ],
    } as never);
    vi.mocked(compassApi.listArticles).mockResolvedValue({ items: [{ id: 'a1', title: '文章' }] } as never);

    const { result } = renderHook(() => useUserCenterAssets(true, setFavoriteToolIds));

    await waitFor(() => expect(result.current.solutionState.key).toBe('loaded'));

    expect(result.current.solutionState.solutions[0].id).toBe('s1');
    expect(result.current.solutionState.tools).toHaveLength(1);
    expect(result.current.solutionState.articles).toHaveLength(1);
    expect(setFavoriteToolIds).toHaveBeenCalledWith(['t1']);
    expect(result.current.favoriteArticleIds.has('a1')).toBe(true);
  });

  it('sets a readable error when loading fails', async () => {
    vi.mocked(compassApi.listSolutions).mockRejectedValue(new Error('接口失败'));
    vi.mocked(compassApi.listTools).mockResolvedValue({ items: [] } as never);
    vi.mocked(compassApi.listFavorites).mockResolvedValue({ items: [] } as never);
    vi.mocked(compassApi.listArticles).mockResolvedValue({ items: [] } as never);

    const { result } = renderHook(() => useUserCenterAssets(true, vi.fn()));

    await waitFor(() => expect(result.current.solutionState.key).toBe('loaded'));

    expect(result.current.solutionState.error).toBe('接口失败');
    expect(result.current.solutionState.solutions).toHaveLength(0);
  });

  it('ignores asset results after unmount', async () => {
    const pending = deferred<{ items: unknown[] }>();
    vi.mocked(compassApi.listSolutions).mockReturnValue(pending.promise as never);
    vi.mocked(compassApi.listTools).mockResolvedValue({ items: [] } as never);
    vi.mocked(compassApi.listFavorites).mockResolvedValue({ items: [] } as never);
    vi.mocked(compassApi.listArticles).mockResolvedValue({ items: [] } as never);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const { unmount } = renderHook(() => useUserCenterAssets(true, vi.fn()));
    unmount();

    pending.resolve({ items: [solution] });
    await pending.promise;
    await Promise.resolve();

    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
