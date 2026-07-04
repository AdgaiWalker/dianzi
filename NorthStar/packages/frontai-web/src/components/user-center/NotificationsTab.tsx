import { useEffect, useState } from 'react';
import { Bell, CheckCircle, LoaderCircle } from 'lucide-react';
import type { NotificationRecord } from '@ns/shared';
import { getErrorMessage } from '@ns/shared';
import { notificationApi } from '@/services/api';

export function NotificationsTab({ isLoggedIn, isEyeCare }: { isLoggedIn: boolean; isEyeCare: boolean }) {
  const [items, setItems] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(isLoggedIn);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoggedIn) return;
    let cancelled = false;
    notificationApi
      .getNotifications()
      .then((result) => {
        if (!cancelled) setItems(result.notifications);
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err, '通知加载失败'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn]);

  const markRead = async (id: string) => {
    const result = await notificationApi.markRead(id);
    setItems((current) => current.map((item) => (item.id === id ? result.notification : item)));
  };

  return (
    <div className={`rounded-2xl p-8 ${isEyeCare ? 'bg-white' : 'bg-white shadow-sm'}`}>
      <h2 className="mb-6 flex items-center gap-2 text-xl font-bold">
        <Bell size={22} /> 通知中心
      </h2>
      {loading && <div className="flex items-center gap-2 text-sm text-slate-500"><LoaderCircle className="animate-spin" size={16} /> 正在加载通知...</div>}
      {error && <div className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
      {!loading && !error && items.length === 0 && <div className="rounded-xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">暂无通知。</div>}
      <div className="space-y-3">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => !item.isRead && void markRead(item.id)}
            className={`w-full rounded-2xl border px-4 py-3 text-left transition hover:bg-slate-50 ${
              item.isRead ? 'border-slate-100 bg-white' : 'border-blue-100 bg-blue-50/70'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`mt-1 rounded-full p-1 ${item.isRead ? 'bg-slate-100 text-slate-400' : 'bg-blue-600 text-white'}`}>
                <CheckCircle size={14} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-bold text-slate-900">{item.title}</div>
                  <div className="shrink-0 text-xs text-slate-400">{new Date(item.createdAt).toLocaleDateString('zh-CN')}</div>
                </div>
                <div className="mt-1 text-sm leading-6 text-slate-500">{item.content}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
