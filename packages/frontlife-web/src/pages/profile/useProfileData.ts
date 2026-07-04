import { useCallback, useEffect, useRef, useState } from 'react';
import type { ProfileResponse } from '@dianzi/shared';
import { api } from '@/services/api';
import { useUIStore } from '@/store/useUIStore';

type CertificationStatus = 'none' | 'pending' | 'verified' | 'rejected';

export function useProfileData(token: string | null) {
  const notifications = useUIStore((state) => state.notifications);
  const setNotifications = useUIStore((state) => state.setNotifications);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState('');
  const [certStatus, setCertStatus] = useState<CertificationStatus>('none');
  const [reloadKey, setReloadKey] = useState(0);
  const requestIdRef = useRef(0);

  const reload = useCallback(() => setReloadKey((value) => value + 1), []);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    let cancelled = false;

    setLoading(true);
    setError('');
    Promise.all([api.getProfile(), api.getNotifications(), api.getCertificationStatus()])
      .then(([profileResult, notificationResult, certResult]) => {
        if (cancelled || requestIdRef.current !== requestId) return;
        setProfile(profileResult);
        setNotifications(notificationResult.notifications);
        setCertStatus(certResult.certification?.status ?? 'none');
      })
      .catch((err) => {
        if (!cancelled && requestIdRef.current === requestId) {
          setError(err instanceof Error ? err.message : '个人页加载失败');
        }
      })
      .finally(() => {
        if (!cancelled && requestIdRef.current === requestId) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      requestIdRef.current += 1;
    };
  }, [reloadKey, setNotifications, token]);

  return {
    profile,
    notifications,
    certStatus,
    setCertStatus,
    loading,
    error,
    reload,
  };
}

export type { CertificationStatus };
