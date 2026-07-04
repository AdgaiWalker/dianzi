import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { BookOpen, HandMetal } from 'lucide-react';
import { EmptyState, ErrorState, LoadingState } from '@/components/LoadingState';
import { spacesApi, postsApi, type ArticleSummary, type PostRecord, type SpaceSummary } from '@/services/api';
import { useUserStore } from '@/store/useUserStore';
import ArticleTree from '@/components/space/ArticleTree';
import AIWritingPanel from '@/components/space/AIWritingPanel';
import PostList from '@/components/space/PostList';
import ClaimSpaceDialog from '@/components/space/ClaimSpaceDialog';

export default function SpacePage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const permissions = useUserStore((state) => state.permissions);
  const userName = useUserStore((state) => state.userName);
  const userId = useUserStore((state) => state.userId);
  const token = useUserStore((state) => state.token);

  const [space, setSpace] = useState<SpaceSummary | null>(null);
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [posts, setPosts] = useState<PostRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [message, setMessage] = useState('');
  const [claimDialogOpen, setClaimDialogOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError('');

    Promise.all([spacesApi.getSpace(id), postsApi.getSpacePosts(id)])
      .then(([spaceResult, postsResult]) => {
        if (cancelled) return;
        setSpace(spaceResult.space);
        setArticles(spaceResult.articles);
        setPosts(postsResult.posts);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : '空间加载失败');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [id, reloadKey]);

  useEffect(() => {
    if (searchParams.get('posted') === '1') {
      setMessage('帖子已发布，已回到对应空间。');
    }
  }, [searchParams]);

  const isSpaceInactive = space ? new Date(space.recentActiveAt) < new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) : false;
  const parentArticles = articles.filter((a) => !a.parentId);

  return (
    <div className="mx-auto max-w-content-max overflow-x-hidden px-4 py-6 sm:px-5 sm:py-8">
      {loading && <LoadingState label="正在加载空间..." />}
      {!loading && error && (
        <ErrorState title="空间加载失败" message={error} onRetry={() => setReloadKey((v) => v + 1)} />
      )}
      {!loading && !error && space && (
        <div className="lg:grid lg:grid-cols-[210px_minmax(0,1fr)_190px] lg:gap-4 xl:grid-cols-[230px_minmax(0,1fr)_220px] xl:gap-5">
          <ArticleTree articles={articles} />

          <main className="min-w-0">
            <header className="rounded-2xl border border-border-light bg-surface p-5 sm:p-6">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-sage-light text-sage">
                <BookOpen size={20} />
              </div>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h1 className="break-words font-display text-[28px] font-bold leading-tight text-ink">{space.title}</h1>
                  <p className="mt-2 text-sm leading-7 text-ink-muted">{space.description}</p>
                  <div className="mt-4 flex flex-wrap gap-3 text-xs text-ink-faint">
                    <span>{space.articleCount} 篇文章</span>
                    <span>{space.helpfulCount} 人确认</span>
                    <span>{space.maintainer.name} 维护</span>
                    {isSpaceInactive && <span className="text-amber-600">较久未更新</span>}
                  </div>
                </div>
                {isSpaceInactive && token && (
                  <button
                    onClick={() => setClaimDialogOpen(true)}
                    className="flex shrink-0 items-center gap-1.5 rounded-lg border border-sage bg-sage-light px-3 py-2 text-sm font-medium text-sage transition-colors hover:bg-sage hover:text-white"
                  >
                    <HandMetal size={14} />
                    申请认领
                  </button>
                )}
              </div>
            </header>

            <section id="knowledge" className="mt-6">
              <AIWritingPanel
                spaceId={space.id}
                spaceTitle={space.title}
                token={token}
                userName={userName}
                canWrite={permissions.canWrite}
                onArticlePublished={(article) => setArticles((prev) => [article, ...prev])}
              />
              <div className="space-y-3">
                {parentArticles.length === 0 && (
                  <EmptyState title="暂无文章" description="这个空间还没有知识文章。等编辑补充后会在这里形成知识体系。" />
                )}
                {parentArticles.map((article) => {
                  const children = articles.filter((c) => c.parentId === article.id);
                  return (
                    <div key={article.id} className="rounded-2xl border border-border-light bg-surface p-5 transition-all hover:border-sage hover:shadow-sm">
                      <Link to={`/article/${article.id}`} className="block">
                        <div className="break-words font-display text-[18px] font-bold leading-6 text-ink">{article.title}</div>
                      </Link>
                      <p className="mt-2 break-words text-sm leading-6 text-ink-muted md:line-clamp-2">{article.summary}</p>
                      <div className="mt-3 text-xs text-ink-faint">{article.helpfulCount} 人确认有帮助</div>
                      {children.length > 0 && (
                        <div className="mt-4 space-y-2 border-l-2 border-sage-light pl-3">
                          {children.map((child) => (
                            <Link key={child.id} to={`/article/${child.id}`} className="block rounded-lg bg-bg-subtle px-3 py-2 text-sm text-ink-secondary">
                              {child.title}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            <PostList
              posts={posts}
              userId={userId}
              token={token}
              userName={userName}
              canPost={permissions.canPost}
              spaceId={space.id}
              onPostsChange={setPosts}
              onMessage={setMessage}
            />
          </main>

          <aside className="sticky top-[72px] hidden h-fit rounded-2xl border border-border-light bg-surface p-4 lg:block">
            <div className="mb-3 text-xs font-semibold tracking-wider text-ink-muted">目录</div>
            <a href="#knowledge" className="block rounded-lg px-3 py-2 text-sm text-ink-secondary hover:bg-bg-subtle hover:text-sage">知识体系</a>
            <a href="#updates" className="block rounded-lg px-3 py-2 text-sm text-ink-secondary hover:bg-bg-subtle hover:text-sage">最新动态</a>
          </aside>
        </div>
      )}
      {message && <div className="mt-3 text-sm text-sage">{message}</div>}

      {claimDialogOpen && (
        <ClaimSpaceDialog
          spaceId={space!.id}
          onClose={() => setClaimDialogOpen(false)}
          onSuccess={(msg) => { setMessage(msg); setClaimDialogOpen(false); }}
        />
      )}
    </div>
  );
}
