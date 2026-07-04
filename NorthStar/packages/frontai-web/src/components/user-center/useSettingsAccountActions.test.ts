import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { complianceApi, identityApi } from '@/services/api';
import { copyText, downloadJson } from '@/utils/browserActions';
import { useSettingsAccountActions } from './useSettingsAccountActions';

vi.mock('@/services/api', () => ({
  identityApi: {
    getGitHubOAuthStatus: vi.fn(),
    startGitHubOAuth: vi.fn(),
    createInvite: vi.fn(),
  },
  complianceApi: {
    exportUserData: vi.fn(),
    requestAccountDeletion: vi.fn(),
  },
}));

vi.mock('@/utils/browserActions', () => ({
  copyText: vi.fn(),
  downloadJson: vi.fn(),
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

describe('useSettingsAccountActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(identityApi.getGitHubOAuthStatus).mockResolvedValue({ configured: true } as never);
  });

  it('loads OAuth state and exports user data through browser actions', async () => {
    vi.mocked(complianceApi.exportUserData).mockResolvedValue({ site: 'com', userId: 'u1', payload: { ok: true } } as never);

    const { result } = renderHook(() => useSettingsAccountActions());

    await waitFor(() => expect(result.current.githubOAuthLoading).toBe(false));
    expect(result.current.githubOAuthConfigured).toBe(true);

    await act(async () => {
      await result.current.exportData();
    });

    expect(downloadJson).toHaveBeenCalledWith('pangen-data-com-u1.json', { site: 'com', userId: 'u1', payload: { ok: true } });
    expect(result.current.accountMessage).toBe('数据导出已开始');
  });

  it('sets a readable error when account export fails', async () => {
    vi.mocked(complianceApi.exportUserData).mockRejectedValue(new Error('导出失败'));

    const { result } = renderHook(() => useSettingsAccountActions());
    await waitFor(() => expect(result.current.githubOAuthLoading).toBe(false));

    await act(async () => {
      await result.current.exportData();
    });

    expect(result.current.accountError).toBe('导出失败');
  });

  it('copies the generated invite link', async () => {
    vi.mocked(identityApi.createInvite).mockResolvedValue({ code: 'INVITE' } as never);

    const { result } = renderHook(() => useSettingsAccountActions());
    await waitFor(() => expect(result.current.githubOAuthLoading).toBe(false));

    await act(async () => {
      await result.current.createInvite();
    });
    await act(async () => {
      await result.current.copyInvite();
    });

    expect(copyText).toHaveBeenCalledWith('http://localhost:3000/login?invite=INVITE');
    expect(result.current.copiedInvite).toBe(true);
  });

  it('ignores OAuth status after unmount', async () => {
    const pending = deferred<{ configured: boolean }>();
    vi.mocked(identityApi.getGitHubOAuthStatus).mockReturnValue(pending.promise as never);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const { unmount } = renderHook(() => useSettingsAccountActions());
    unmount();

    await act(async () => {
      pending.resolve({ configured: true });
      await pending.promise;
    });

    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
