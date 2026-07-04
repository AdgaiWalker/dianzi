import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flag, LoaderCircle, MessageCircle, Pencil } from 'lucide-react';
import { EmptyState } from '@/components/LoadingState';
import type { PostRecord } from '@/services/api';
import { postsApi, moderationApi } from '@/services/api';
import { POST_TAGS, tagLabel } from '@/constants/post';
import PostDetailModal from './PostDetailModal';

interface PostListProps {
  posts: PostRecord[];
  userId: string | null;
  token: string | null;
  userName: string | null;
  canPost: boolean;
  spaceId: string;
  onPostsChange: (posts: PostRecord[]) => void;
  onMessage: (msg: string) => void;
}

export default function PostList({
  posts,
  userId,
  token,
  userName,
  canPost,
  spaceId,
  onPostsChange,
  onMessage,
}: PostListProps) {
  const navigate = useNavigate();

  /* 发帖 */
  const [postContent, setPostContent] = useState('');
  const [postTag, setPostTag] = useState('share');
  const [postSubmitting, setPostSubmitting] = useState(false);
  const [postError, setPostError] = useState('');

  /* 举报 */
  const [reportPostId, setReportPostId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');

  /* 编辑帖子 */
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editPostContent, setEditPostContent] = useState('');
  const [editPostSubmitting, setEditPostSubmitting] = useState(false);
  const [editPostError, setEditPostError] = useState('');

  /* 帖子详情弹窗 */
  const [activePost, setActivePost] = useState<PostRecord | null>(null);

  const visiblePosts = posts.slice(0, 12);

  /* --- handlers --- */

  const publishPost = async () => {
    if (!token) return navigate('/login');
    if (!postContent.trim()) return;
    setPostError('');
    setPostSubmitting(true);
    try {
      const result = await postsApi.createPost({
        spaceId,
        content: postContent.trim(),
        tags: [postTag],
        authorName: userName ?? '张同学',
      });
      onPostsChange([result.post, ...posts]);
      setPostContent('');
      onMessage('已发布');
    } catch (err) {
      setPostError(err instanceof Error ? err.message : '发布失败，请稍后重试');
    } finally {
      setPostSubmitting(false);
    }
  };

  const submitPostReport = async (postId: string) => {
    if (!token) return navigate('/login');
    if (!reportReason.trim()) return;
    try {
      await moderationApi.reportContent({
        targetType: 'post',
        targetId: postId,
        reason: reportReason.trim(),
      });
      setReportPostId(null);
      setReportReason('');
      onMessage('举报已提交');
    } catch (err) {
      setPostError(err instanceof Error ? err.message : '举报提交失败，请稍后重试。');
    }
  };

  const startEditPost = (post: PostRecord) => {
    setEditingPostId(post.id);
    setEditPostContent(post.content);
    setEditPostError('');
  };

  const cancelEditPost = () => {
    setEditingPostId(null);
    setEditPostContent('');
    setEditPostError('');
  };

  const submitEditPost = async () => {
    if (!token || !editingPostId) return;
    if (!editPostContent.trim()) {
      setEditPostError('内容不能为空');
      return;
    }
    setEditPostError('');
    setEditPostSubmitting(true);
    try {
      const result = await postsApi.updatePost(editingPostId, {
        content: editPostContent.trim(),
      });
      onPostsChange(posts.map((p) => (p.id === editingPostId ? result.post : p)));
      if (activePost?.id === editingPostId) setActivePost(result.post);
      cancelEditPost();
      onMessage('帖子已更新');
    } catch (err) {
      setEditPostError(err instanceof Error ? err.message : '更新失败，请稍后重试');
    } finally {
      setEditPostSubmitting(false);
    }
  };

  const solvePost = async (post: PostRecord) => {
    if (!token) return navigate('/login');
    try {
      const result = await postsApi.markPostSolved(post.id);
      const updatedPost = { ...post, solved: result.post.solved ?? true };
      onPostsChange(posts.map((p) => (p.id === post.id ? updatedPost : p)));
      if (activePost?.id === post.id) setActivePost(updatedPost);
    } catch {
      // 静默失败，用户可重试
    }
  };

  const handlePostUpdate = (updatedPost: PostRecord) => {
    setActivePost(updatedPost);
    onPostsChange(posts.map((p) => (p.id === updatedPost.id ? updatedPost : p)));
  };

  return (
    <>
      <section id="updates" className="mt-7">
        <h2 className="mb-3 text-[15px] font-semibold text-ink-secondary">最新动态</h2>

        {/* 发帖表单 */}
        {token && canPost && (
          <div className="mb-4 rounded-2xl border border-border-light bg-surface p-4">
            <textarea
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder="在这里说点什么..."
              className="h-20 w-full resize-none rounded-xl border border-border bg-bg-subtle px-3 py-2 text-sm outline-none focus:border-sage"
            />
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
              <select
                value={postTag}
                onChange={(e) => setPostTag(e.target.value)}
                className="h-10 min-w-0 rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-sage"
              >
                {POST_TAGS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <button
                onClick={publishPost}
                disabled={postSubmitting || !postContent.trim()}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-sage px-4 text-sm font-medium text-white disabled:bg-ink-faint"
              >
                {postSubmitting && <LoaderCircle size={15} className="mr-1.5 animate-spin" />}
                发布
              </button>
            </div>
            {postError && <div className="mt-2 text-sm text-rose-custom">{postError}</div>}
          </div>
        )}

        {/* 帖子列表 */}
        <div className="space-y-3">
          {posts.length === 0 && (
            <EmptyState title="暂无帖子" description="这个空间还没有同学动态。" />
          )}
          {posts.length > visiblePosts.length && (
            <div className="rounded-xl border border-border-light bg-bg-subtle px-4 py-3 text-sm text-ink-muted">
              共 {posts.length} 条动态，显示最近 {visiblePosts.length} 条
            </div>
          )}
          {visiblePosts.map((post) => (
            <div key={post.id} className="rounded-2xl border border-border-light bg-surface p-4">
              {editingPostId === post.id ? (
                /* 内联编辑模式 */
                <div className="space-y-3">
                  <textarea
                    value={editPostContent}
                    onChange={(e) => setEditPostContent(e.target.value)}
                    placeholder="帖子内容"
                    rows={4}
                    className="w-full resize-none rounded-lg border border-border bg-bg-subtle px-3 py-2 text-sm outline-none focus:border-sage"
                  />
                  {editPostError && <div className="text-sm text-rose-custom">{editPostError}</div>}
                  <div className="flex gap-2">
                    <button
                      onClick={submitEditPost}
                      disabled={editPostSubmitting}
                      className="inline-flex h-9 items-center justify-center rounded-lg bg-sage px-4 text-sm font-medium text-white disabled:bg-ink-faint"
                    >
                      {editPostSubmitting && <LoaderCircle size={15} className="mr-1.5 animate-spin" />}
                      保存
                    </button>
                    <button
                      onClick={cancelEditPost}
                      disabled={editPostSubmitting}
                      className="inline-flex h-9 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium text-ink-secondary hover:bg-bg-subtle"
                    >
                      取消
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-2 flex items-center justify-between gap-2 text-xs text-ink-muted">
                    <span className="flex items-center gap-2">
                      <MessageCircle size={14} className="text-sage" />
                      {post.author.name}
                    </span>
                    <div className="flex items-center gap-2">
                      {post.author.id === userId && (
                        <button onClick={() => startEditPost(post)} className="text-ink-faint hover:text-sage" title="编辑">
                          <Pencil size={13} />
                        </button>
                      )}
                      <button onClick={() => (token ? setReportPostId(post.id) : navigate('/login'))} className="text-ink-faint hover:text-rose-custom">
                        <Flag size={13} className="mr-1 inline" />
                        举报
                      </button>
                    </div>
                  </div>
                  <button onClick={() => setActivePost(post)} className="block w-full break-words text-left text-[15px] leading-7 text-ink">
                    {post.content}
                  </button>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink-faint">
                    {post.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-bg-subtle px-2 py-0.5">
                        {tagLabel(tag)}
                      </span>
                    ))}
                    <span>{post.replyCount} 条回复</span>
                    {post.solved && <span className="text-sage">已解决</span>}
                    {token && post.tags.includes('help') && !post.solved && (
                      <button onClick={() => solvePost(post)} className="text-sage">
                        标记解决了
                      </button>
                    )}
                  </div>
                  {/* 举报表单 */}
                  {reportPostId === post.id && (
                    <div className="mt-3 rounded-xl border border-border-light bg-bg-subtle p-3">
                      <input
                        value={reportReason}
                        onChange={(e) => setReportReason(e.target.value)}
                        placeholder="请说明举报原因"
                        className="h-9 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-sage"
                      />
                      <button onClick={() => submitPostReport(post.id)} className="mt-2 rounded-lg bg-sage px-3 py-1.5 text-xs font-medium text-white">
                        提交举报
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 帖子详情弹窗 */}
      {activePost && (
        <PostDetailModal
          post={activePost}
          userId={userId}
          token={token}
          onClose={() => setActivePost(null)}
          onPostUpdate={handlePostUpdate}
        />
      )}
    </>
  );
}
