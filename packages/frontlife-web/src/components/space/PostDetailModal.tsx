import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { PostRecord } from '@/services/api';
import { postsApi } from '@/services/api';

interface PostDetailModalProps {
  post: PostRecord;
  userId: string | null;
  token: string | null;
  onClose: () => void;
  onPostUpdate: (post: PostRecord) => void;
}

export default function PostDetailModal({ post, userId: _userId, token, onClose, onPostUpdate }: PostDetailModalProps) {
  const navigate = useNavigate();
  const [replyContent, setReplyContent] = useState('');
  const [replyError, setReplyError] = useState('');

  const submitReply = async () => {
    if (!token) return navigate('/login');
    if (!replyContent.trim()) return;
    setReplyError('');
    try {
      const result = await postsApi.replyToPost(post.id, replyContent.trim());
      const updatedPost: PostRecord = {
        ...post,
        replies: [result.reply, ...(post.replies ?? [])],
        replyCount: post.replyCount + 1,
      };
      onPostUpdate(updatedPost);
      setReplyContent('');
    } catch (err) {
      setReplyError(err instanceof Error ? err.message : '回复失败，请稍后重试');
    }
  };

  const solvePost = async () => {
    if (!token) return navigate('/login');
    try {
      const result = await postsApi.markPostSolved(post.id);
      onPostUpdate({ ...post, solved: result.post.solved ?? true });
    } catch {
      // 静默失败，用户可重试
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/30 px-4" onClick={onClose}>
      <div className="max-h-[82vh] w-full max-w-[560px] overflow-y-auto rounded-2xl bg-white p-4 shadow-lg sm:p-5" onClick={(e) => e.stopPropagation()}>
        <div className="mb-2 text-xs text-ink-muted">{post.author.name}</div>
        <p className="break-words text-[17px] font-medium leading-8 text-ink">{post.content}</p>
        <div className="mt-5 border-t border-border-light pt-4">
          {token && post.tags.includes('help') && !post.solved && (
            <button onClick={solvePost} className="mb-3 rounded-lg bg-sage-light px-3 py-1.5 text-xs font-medium text-sage">
              标记解决了
            </button>
          )}
          <div className="mb-3 text-sm font-semibold text-ink-secondary">回复</div>
          <div className="space-y-3">
            {(post.replies ?? []).map((reply) => (
              <div key={reply.id} className="rounded-xl bg-bg-subtle p-3">
                <div className="text-xs text-ink-muted">{reply.author.name}</div>
                <div className="mt-1 break-words text-sm leading-6 text-ink">{reply.content}</div>
                <div className="mt-1 text-xs text-ink-faint">{reply.starCount} 星标</div>
              </div>
            ))}
          </div>
          {replyError && <div className="mt-3 text-sm text-rose-custom">{replyError}</div>}
          {token ? (
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <input
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="写回复..."
                className="h-10 min-w-0 flex-1 rounded-lg border border-border px-3 text-sm outline-none focus:border-sage"
              />
              <button onClick={submitReply} className="rounded-lg bg-sage px-4 text-sm font-medium text-white">
                回复
              </button>
            </div>
          ) : (
            <button onClick={() => navigate('/login')} className="mt-4 rounded-lg bg-sage px-4 py-2 text-sm font-medium text-white">
              登录后回复
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
