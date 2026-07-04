import { useEffect, useState } from 'react';
import { getErrorMessage } from '@dianzi/shared';
import type { InviteCodeRecord } from '@dianzi/shared';
import { complianceApi, identityApi } from '@/services/api';
import { copyText, downloadJson } from '@/utils/browserActions';

export function useSettingsAccountActions() {
  const [githubOAuthConfigured, setGithubOAuthConfigured] = useState(false);
  const [githubOAuthLoading, setGithubOAuthLoading] = useState(true);
  const [githubOAuthError, setGithubOAuthError] = useState('');
  const [invite, setInvite] = useState<InviteCodeRecord | null>(null);
  const [inviteError, setInviteError] = useState('');
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [accountMessage, setAccountMessage] = useState('');
  const [accountError, setAccountError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deletionConfirmOpen, setDeletionConfirmOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    identityApi.getGitHubOAuthStatus()
      .then((result) => { if (!cancelled) setGithubOAuthConfigured(result.configured); })
      .catch(() => { if (!cancelled) setGithubOAuthConfigured(false); })
      .finally(() => { if (!cancelled) setGithubOAuthLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const startGitHubBind = async () => {
    setGithubOAuthError('');
    setGithubOAuthLoading(true);
    try {
      const result = await identityApi.startGitHubOAuth();
      window.location.href = result.authorizeUrl;
    } catch (error) {
      setGithubOAuthError(getErrorMessage(error, 'GitHub OAuth 启动失败，请稍后重试。'));
      setGithubOAuthLoading(false);
    }
  };

  const createInvite = async () => {
    setInviteError('');
    try {
      const result = await identityApi.createInvite();
      setInvite(result);
    } catch (error) {
      setInviteError(getErrorMessage(error, '邀请码获取失败，请稍后重试。'));
    }
  };

  const copyInvite = async () => {
    if (!invite) return;
    const link = `${window.location.origin}/login?invite=${encodeURIComponent(invite.code)}`;
    await copyText(link);
    setCopiedInvite(true);
    window.setTimeout(() => setCopiedInvite(false), 1800);
  };

  const exportData = async () => {
    setAccountError('');
    setAccountMessage('');
    try {
      const result = await complianceApi.exportUserData();
      downloadJson(`pangen-data-${result.site}-${result.userId}.json`, result);
      setAccountMessage('数据导出已开始');
    } catch (error) {
      setAccountError(getErrorMessage(error, '数据导出失败，请稍后重试。'));
    }
  };

  const requestDeletion = async () => {
    setDeleting(true);
    setAccountError('');
    setAccountMessage('');
    try {
      await complianceApi.requestAccountDeletion({ reason: '用户在全球站设置页主动申请注销' });
      setAccountMessage('注销申请已提交');
      setDeletionConfirmOpen(false);
    } catch (error) {
      setAccountError(getErrorMessage(error, '注销申请提交失败，请稍后重试。'));
    } finally {
      setDeleting(false);
    }
  };

  return {
    githubOAuthConfigured,
    githubOAuthLoading,
    githubOAuthError,
    invite,
    inviteError,
    copiedInvite,
    accountMessage,
    accountError,
    deleting,
    deletionConfirmOpen,
    setDeletionConfirmOpen,
    startGitHubBind,
    createInvite,
    copyInvite,
    exportData,
    requestDeletion,
  };
}
