import { useState } from 'react';
import { HandMetal } from 'lucide-react';
import { spacesApi } from '@/services/api';

interface ClaimSpaceDialogProps {
  spaceId: string;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export default function ClaimSpaceDialog({ spaceId, onClose, onSuccess }: ClaimSpaceDialogProps) {
  const [claimReason, setClaimReason] = useState('');
  const [claimSubmitting, setClaimSubmitting] = useState(false);
  const [claimError, setClaimError] = useState('');

  const submitClaim = async () => {
    if (!claimReason.trim()) {
      setClaimError('请说明认领理由。');
      return;
    }
    setClaimError('');
    setClaimSubmitting(true);
    try {
      await spacesApi.claimSpace(spaceId, claimReason.trim());
      setClaimReason('');
      onClose();
      onSuccess('认领申请已提交，请等待审核。');
    } catch (err) {
      setClaimError(err instanceof Error ? err.message : '认领申请提交失败，请稍后重试。');
    } finally {
      setClaimSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div className="w-full max-w-[420px] rounded-2xl bg-white p-5 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center gap-2">
          <HandMetal size={20} className="text-sage" />
          <h3 className="text-lg font-semibold text-ink">申请认领空间</h3>
        </div>
        <p className="mb-4 text-sm text-ink-muted">
          该空间较久未更新，你可以申请成为维护者。请说明你的认领理由和计划。
        </p>
        <textarea
          value={claimReason}
          onChange={(e) => setClaimReason(e.target.value)}
          placeholder="说明你的认领理由，比如你是该领域的负责人、有定期更新的计划等..."
          className="h-28 w-full resize-none rounded-xl border border-border bg-bg-subtle px-3 py-2 text-sm outline-none focus:border-sage"
        />
        <div className="mt-4 flex gap-2">
          <button
            onClick={submitClaim}
            disabled={claimSubmitting || !claimReason.trim()}
            className="flex-1 rounded-lg bg-sage px-4 py-2 text-sm font-medium text-white disabled:bg-ink-faint"
          >
            {claimSubmitting ? '提交中...' : '提交申请'}
          </button>
          <button
            onClick={() => {
              setClaimReason('');
              setClaimError('');
              onClose();
            }}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink-secondary hover:bg-bg-subtle"
          >
            取消
          </button>
        </div>
        {claimError && <div className="mt-3 text-sm text-rose-custom">{claimError}</div>}
      </div>
    </div>
  );
}
