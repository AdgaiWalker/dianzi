import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/services/api';
import { useUIStore } from '@/store/useUIStore';
import { useProfileData } from './useProfileData';

vi.mock('@/services/api', () => ({
  api: {
    getProfile: vi.fn(),
    getNotifications: vi.fn(),
    getCertificationStatus: vi.fn(),
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

const profile = {
  user: { name: '张同学', school: '北星大学' },
  stats: { helpedCount: 1, articleCount: 2, favoriteCount: 3 },
  spaces: [],
  contents: [],
  favorites: [],
  canCreateSpace: false,
};

describe('useProfileData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useUIStore.getState().resetNotifications();
  });

  it('loads profile, notifications, and certification status', async () => {
    vi.mocked(api.getProfile).mockResolvedValue(profile as any);
    vi.mocked(api.getNotifications).mockResolvedValue({ notifications: [{ id: 'n1', title: '通知', content: '内容', isRead: false }] } as any);
    vi.mocked(api.getCertificationStatus).mockResolvedValue({ certification: { status: 'verified' } } as any);

    const { result } = renderHook(() => useProfileData('token'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.profile?.user.name).toBe('张同学');
    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.certStatus).toBe('verified');
    expect(result.current.error).toBe('');
  });

  it('returns the fallback error when loading fails', async () => {
    vi.mocked(api.getProfile).mockRejectedValue(new Error('个人页加载失败'));
    vi.mocked(api.getNotifications).mockResolvedValue({ notifications: [] } as any);
    vi.mocked(api.getCertificationStatus).mockResolvedValue({ certification: null } as any);

    const { result } = renderHook(() => useProfileData('token'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('个人页加载失败');
    expect(result.current.profile).toBeNull();
  });

  it('ignores aggregate results after unmount', async () => {
    const pending = deferred<any>();
    vi.mocked(api.getProfile).mockReturnValue(pending.promise);
    vi.mocked(api.getNotifications).mockResolvedValue({ notifications: [] } as any);
    vi.mocked(api.getCertificationStatus).mockResolvedValue({ certification: null } as any);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const { unmount } = renderHook(() => useProfileData('token'));
    unmount();

    await act(async () => {
      pending.resolve(profile);
      await pending.promise;
    });

    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
