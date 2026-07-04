import { useState } from 'react';
import type { AccountDeletionRequestRecord, DataExportResponse } from '@dianzi/shared';
import { api } from '@/services/api';
import { useUIStore } from '@/store/useUIStore';
import type { CertificationStatus } from './useProfileData';

export function useProfileActions(setCertStatus: (status: CertificationStatus) => void) {
  const markNotificationRead = useUIStore((state) => state.markNotificationRead);
  const [notificationError, setNotificationError] = useState('');
  const [exportResult, setExportResult] = useState<DataExportResponse | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState('');
  const [deletionReason, setDeletionReason] = useState('');
  const [deletionRequest, setDeletionRequest] = useState<AccountDeletionRequestRecord | null>(null);
  const [deletionLoading, setDeletionLoading] = useState(false);
  const [deletionError, setDeletionError] = useState('');
  const [certDialogOpen, setCertDialogOpen] = useState(false);
  const [certSchoolId, setCertSchoolId] = useState('');
  const [certSchoolName, setCertSchoolName] = useState('');
  const [certSubmitting, setCertSubmitting] = useState(false);
  const [certError, setCertError] = useState('');

  const exportData = async () => {
    setExportLoading(true);
    setExportError('');

    try {
      setExportResult(await api.exportUserData());
    } catch (err) {
      setExportError(err instanceof Error ? err.message : '数据导出失败，请稍后重试。');
    } finally {
      setExportLoading(false);
    }
  };

  const requestDeletion = async () => {
    setDeletionLoading(true);
    setDeletionError('');

    try {
      const result = await api.requestAccountDeletion({
        reason: deletionReason,
      });
      setDeletionRequest(result);
      setDeletionReason('');
    } catch (err) {
      setDeletionError(err instanceof Error ? err.message : '注销申请提交失败，请稍后重试。');
    } finally {
      setDeletionLoading(false);
    }
  };

  const submitCertApplication = async () => {
    if (!certSchoolId.trim() || !certSchoolName.trim()) {
      setCertError('请填写完整的学校信息');
      return;
    }
    setCertError('');
    setCertSubmitting(true);
    try {
      await api.applyCertification({
        schoolId: certSchoolId.trim(),
        schoolName: certSchoolName.trim(),
      });
      setCertStatus('pending');
      setCertDialogOpen(false);
      setCertSchoolId('');
      setCertSchoolName('');
    } catch (err) {
      setCertError(err instanceof Error ? err.message : '认证申请提交失败，请稍后重试。');
    } finally {
      setCertSubmitting(false);
    }
  };

  const markNotificationAsRead = async (id: string) => {
    setNotificationError('');
    try {
      await api.markNotificationRead(id);
      markNotificationRead(id);
    } catch (err) {
      setNotificationError(err instanceof Error ? err.message : '通知标记已读失败，请稍后重试。');
    }
  };

  const closeCertDialog = () => {
    setCertDialogOpen(false);
    setCertSchoolId('');
    setCertSchoolName('');
    setCertError('');
  };

  return {
    notificationError,
    exportResult,
    exportLoading,
    exportError,
    deletionReason,
    setDeletionReason,
    deletionRequest,
    deletionLoading,
    deletionError,
    certDialogOpen,
    setCertDialogOpen,
    certSchoolId,
    setCertSchoolId,
    certSchoolName,
    setCertSchoolName,
    certSubmitting,
    certError,
    exportData,
    requestDeletion,
    submitCertApplication,
    markNotificationAsRead,
    closeCertDialog,
  };
}
