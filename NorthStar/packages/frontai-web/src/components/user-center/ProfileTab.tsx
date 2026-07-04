import { useEffect, useState } from 'react';
import type { User } from '@/types';
import { identityApi } from '@/services/api';
import { getErrorMessage } from '@ns/shared';
import { UserAvatar } from '@/components/UserAvatar';

interface ProfileTabProps {
  currentUser: User | null;
  isEyeCare: boolean;
  onProfileUpdated: () => void;
}

export function ProfileTab({ currentUser, isEyeCare, onProfileUpdated }: ProfileTabProps) {
  const [displayName, setDisplayName] = useState(currentUser?.name || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDisplayName(currentUser?.name || '');
  }, [currentUser?.name]);

  const saveProfile = async () => {
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await identityApi.updateCompassProfile({ displayName: displayName.trim() });
      setMessage('资料已保存');
      onProfileUpdated();
    } catch (err) {
      setError(getErrorMessage(err, '资料保存失败，请稍后重试。'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`p-8 rounded-2xl ${isEyeCare ? 'bg-white' : 'bg-white shadow-sm'}`}>
      <h2 className="text-xl font-bold mb-4">个人资料</h2>
      <div className="flex items-center gap-4 mb-6">
        <UserAvatar name={currentUser?.name} imageUrl={currentUser?.avatar} className="h-20 w-20 rounded-full" />
        <div>
          <div className="font-bold text-lg">{currentUser?.name || '未命名用户'}</div>
          <div className="text-slate-500">{currentUser?.email || '未绑定邮箱'}</div>
        </div>
      </div>
      <div className="space-y-4 max-w-md">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">昵称</label>
          <input
            type="text"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">邮箱</label>
          <input type="text" defaultValue={currentUser?.email || '未绑定邮箱'} disabled className="w-full p-2 bg-slate-50 rounded-lg border-none opacity-50 cursor-not-allowed" />
        </div>
        {error && <div className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
        {message && <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</div>}
        <button
          type="button"
          onClick={() => void saveProfile()}
          disabled={saving || !displayName.trim()}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {saving ? '保存中' : '保存资料'}
        </button>
      </div>
    </div>
  );
}
