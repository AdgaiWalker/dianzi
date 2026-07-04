import { useEffect, useState } from 'react';
import { Heart, LoaderCircle, MessageSquare, Send } from 'lucide-react';
import type { ContentCommentRecord } from '@dianzi/shared';
import { getErrorMessage } from '@dianzi/shared';
import { compassApi } from '@/services/api';
import { useAppStore } from '@/store/useAppStore';

export function ContentInteractions({ contentId, initialLikes = 0 }: { contentId: string; initialLikes?: number }) {
  const { isLoggedIn } = useAppStore();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikes);
  const [comments, setComments] = useState<ContentCommentRecord[]>([]);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    compassApi
      .listComments(contentId)
      .then((result) => {
        if (!cancelled) setComments(result.items);
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err, '评论加载失败'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [contentId]);

  const toggleLike = async () => {
    if (!isLoggedIn) {
      setError('登录后可以点赞和评论。');
      return;
    }
    setError('');
    const result = liked ? await compassApi.unlikeContent(contentId) : await compassApi.likeContent(contentId);
    setLiked(result.liked);
    setLikeCount(result.likeCount);
  };

  const submitComment = async () => {
    if (!isLoggedIn) {
      setError('登录后可以点赞和评论。');
      return;
    }
    const content = comment.trim();
    if (!content) return;
    setError('');
    const result = await compassApi.createComment(contentId, { content });
    setComments((current) => [result.comment, ...current]);
    setComment('');
  };

  return (
    <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900">
          <MessageSquare size={18} /> 互动
        </h2>
        <button
          type="button"
          onClick={() => void toggleLike()}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold ${
            liked ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Heart size={16} className={liked ? 'fill-rose-500' : ''} />
          {likeCount} 赞
        </button>
      </div>
      <div className="mb-4 flex gap-2">
        <input
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
          placeholder={isLoggedIn ? '写下你的补充或体验' : '登录后可发表评论'}
        />
        <button
          type="button"
          onClick={() => void submitComment()}
          disabled={!comment.trim()}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:bg-slate-300"
        >
          <Send size={15} /> 发布
        </button>
      </div>
      {error && <div className="mb-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700">{error}</div>}
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-slate-400"><LoaderCircle className="animate-spin" size={15} /> 正在加载评论...</div>
      ) : comments.length === 0 ? (
        <div className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">还没有评论。</div>
      ) : (
        <div className="space-y-3">
          {comments.map((item) => (
            <div key={item.id} className="rounded-xl bg-slate-50 px-4 py-3">
              <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
                <span className="font-bold text-slate-600">{item.authorName}</span>
                <span>{new Date(item.createdAt).toLocaleString('zh-CN')}</span>
              </div>
              <div className="text-sm leading-6 text-slate-700">{item.content}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
