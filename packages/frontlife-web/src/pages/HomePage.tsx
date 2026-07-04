import { useCallback, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertTriangle, BookOpen, MessageCircle, Search, Sparkles } from 'lucide-react';
import type { FrontlifeFeedItem } from '@dianzi/shared';
import { useInfiniteFeed } from '@/hooks/useInfiniteFeed';
import { api } from '@/services/api';
import { useUserStore } from '@/store/useUserStore';
import { useUIStore } from '@/store/useUIStore';
import FeedSkeleton, { FeedSkeletonList } from '@/components/FeedSkeleton';
import { EmptyState, ErrorState } from '@/components/LoadingState';
import { useHomeComposer } from './home/useHomeComposer';

const PAGE_SIZE = 6;

export default function HomePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const canPost = useUserStore((state) => state.permissions.canPost);
  const userName = useUserStore((state) => state.userName);
  const setShowSearch = useUIStore((state) => state.setShowSearch);
  const [query, setQuery] = useState('');
  const [showGuide, setShowGuide] = useState(() => !localStorage.getItem('guide_dismissed'));
  const {
    writeOpen,
    setWriteOpen,
    postContent,
    setPostContent,
    postSpaceId,
    setPostSpaceId,
    postTag,
    setPostTag,
    spaces,
    spacesError,
    postError,
    homeSpaces,
    loadSpaces,
    publishPost,
  } = useHomeComposer({
    searchParams,
    canPost,
    userName,
    onPosted: (spaceId) => navigate(`/space/${spaceId}?posted=1`),
  });

  const fetchData = useCallback(async (page: number) => {
    const result = await api.getFeed(page, PAGE_SIZE);
    return { items: result.items, hasMore: result.hasMore };
  }, []);

  const { items, initialLoading, loading, hasMore, error: feedError, retry: retryFeed, loaderRef } = useInfiniteFeed<FrontlifeFeedItem>({
    fetchData,
  });

  return (
    <div className="mx-auto max-w-content-max overflow-x-hidden px-4 pb-28 pt-6 md:px-5 md:pt-12">
      {showGuide && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-sage-light px-4 py-3 text-sm text-sage">
          <span className="flex-1">试着搜一个你关心的问题，比如"食堂几点关门"</span>
          <button
            onClick={() => { setShowGuide(false); localStorage.setItem('guide_dismissed', '1'); }}
            className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-sage hover:bg-sage/10"
          >
            知道了
          </button>
        </div>
      )}
      <section className="mx-auto max-w-reader-max">
        <p className="text-xs font-semibold tracking-[0.22em] text-sage">PANGEN CAMPUS</p>
        <h1 className="mt-3 font-display text-[34px] font-bold leading-tight text-ink md:text-[46px]">
          问清楚，再出门。
        </h1>
        <p className="mt-3 text-[15px] leading-7 text-ink-muted">
          搜索食堂、报到、选课和二手信息。先看已确认内容，没有结果再由 AI 兜底。
        </p>

        <div
          onClick={() => setShowSearch(true)}
          className="mt-6 flex h-14 min-w-0 cursor-pointer items-center gap-2 rounded-2xl border border-border-light bg-bg-subtle px-3 transition-colors hover:border-sage sm:gap-3 sm:px-4"
        >
          <Search size={18} className="shrink-0 text-ink-faint" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onClick={() => setShowSearch(true)}
            placeholder="问点什么，或者分享点什么"
            className="h-full min-w-0 flex-1 cursor-pointer bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-faint"
            readOnly
          />
          <button
            onClick={(event) => {
              event.stopPropagation();
              setShowSearch(true);
            }}
            className="shrink-0 rounded-xl bg-sage px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-sage-dark sm:px-4"
          >
            搜索
          </button>
        </div>

        {canPost && (
          <div className="mt-4 rounded-2xl border border-border-light bg-surface p-4">
            <button
              onClick={() => setWriteOpen((value) => !value)}
              className="w-full text-left text-sm font-medium text-ink-secondary"
            >
              写点什么
            </button>
            {writeOpen && (
              <div className="mt-3 space-y-3">
                <textarea
                  value={postContent}
                  onChange={(event) => setPostContent(event.target.value)}
                  placeholder="分享、求助、二手、活动，都可以先写在这里。"
                  className="h-24 w-full resize-none rounded-xl border border-border bg-bg-subtle px-3 py-2 text-sm outline-none focus:border-sage"
                />
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <select
                    value={postSpaceId}
                    onChange={(event) => setPostSpaceId(event.target.value)}
                    disabled={spaces.length === 0}
                    className="h-10 rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-sage"
                  >
                    {spaces.map((space) => (
                      <option key={space.id} value={space.id}>
                        {space.title}
                      </option>
                    ))}
                  </select>
                  <select
                    value={postTag}
                    onChange={(event) => setPostTag(event.target.value)}
                    className="h-10 rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-sage"
                  >
                    <option value="share">#分享</option>
                    <option value="help">#求助</option>
                    <option value="secondhand">#二手</option>
                    <option value="event">#活动</option>
                    <option value="discussion">#讨论</option>
                  </select>
                </div>
                <button onClick={publishPost} className="w-full rounded-lg bg-sage px-4 py-2 text-sm font-medium text-white sm:w-auto">
                  发布
                </button>
                {spacesError && (
                  <div className="rounded-lg bg-rose-light px-3 py-2 text-sm text-rose-custom">
                    {spacesError}
                  </div>
                )}
                {postError && (
                  <div className="rounded-lg bg-rose-light px-3 py-2 text-sm text-rose-custom">
                    {postError}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      <section className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        {spacesError && (
          <div className="col-span-full">
            <ErrorState title="空间加载失败" message={spacesError} onRetry={loadSpaces} />
          </div>
        )}
        {!spacesError && spaces.length === 0 && (
          <div className="col-span-full">
            <EmptyState title="暂无空间" description="当前还没有可浏览的校园空间。" />
          </div>
        )}
        {!spacesError && homeSpaces.map((space) => (
            <button
              key={space.id}
              onClick={() => navigate(`/space/${space.id}`)}
              className="min-h-[132px] rounded-2xl border border-border-light bg-surface p-4 text-left transition-all hover:-translate-y-0.5 hover:border-sage hover:shadow-md"
            >
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-sage-light text-sage">
                <BookOpen size={17} />
              </div>
              <div className="break-words font-display text-[16px] font-bold leading-6 text-ink">{space.title}</div>
              <div className="mt-1 text-xs leading-5 text-ink-muted">{space.helpfulCount} 人确认</div>
            </button>
        ))}
      </section>

      <section className="mt-9 md:mx-auto md:max-w-reader-max">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-ink-secondary">生活流</h2>
          <button onClick={() => navigate('/explore')} className="text-xs font-medium text-sage">
            看全部空间
          </button>
        </div>

        {initialLoading && <FeedSkeletonList count={3} />}
        {!initialLoading && feedError && (
          <ErrorState title="生活流加载失败" message={feedError} onRetry={retryFeed} />
        )}
        {!initialLoading && !feedError && items.length === 0 && (
          <EmptyState title="暂无生活流内容" description="当前还没有文章、动态或 AI 回答记录。" />
        )}
        {!initialLoading && !feedError && items.length > 0 && (
          <div className="space-y-3">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  if (item.type === 'article') navigate(`/article/${item.articleId}`);
                  if (item.type === 'post') navigate(`/space/${item.spaceId}`);
                  if (item.type === 'changed') navigate(`/article/${item.articleId}`);
                  if (item.type === 'ai') navigate(`/search?q=${encodeURIComponent(item.query)}`);
                }}
                className="w-full rounded-2xl border border-border-light bg-surface p-4 text-left transition-all hover:border-sage hover:shadow-sm"
              >
                <FeedRow item={item} />
              </button>
            ))}
          </div>
        )}
        {loading && !initialLoading && <FeedSkeleton />}
        {!initialLoading && !hasMore && items.length > 0 && (
          <div className="py-8 text-center text-xs text-ink-faint">已经到底了</div>
        )}
        <div ref={loaderRef} className="h-4" />
      </section>
    </div>
  );
}

function FeedRow({ item }: { item: FrontlifeFeedItem }) {
  if (item.type === 'article') {
    return (
      <>
        <div className="mb-2 flex items-center gap-2 text-xs text-ink-muted">
          <BookOpen size={14} className="text-sage" />
          {item.actorName} 更新了文章
        </div>
        <div className="break-words font-display text-[17px] font-bold leading-6 text-ink">{item.title}</div>
        <div className="mt-1 text-xs text-ink-faint">{item.helpfulCount} 人确认有帮助</div>
      </>
    );
  }

  if (item.type === 'post') {
    return (
      <>
        <div className="mb-2 flex items-center gap-2 text-xs text-ink-muted">
          <MessageCircle size={14} className="text-sage" />
          {item.actorName}
        </div>
        <div className="break-words text-[16px] font-medium leading-7 text-ink">{item.content}</div>
      </>
    );
  }

  if (item.type === 'changed') {
    return (
      <>
        <div className="mb-2 flex items-center gap-2 text-xs text-ink-muted">
          <AlertTriangle size={14} className="text-amber-custom" />
          {item.actorName}
        </div>
        <div className="break-words font-display text-[17px] font-bold leading-6 text-ink">{item.title}</div>
        <div className="mt-1 break-words text-sm text-ink-muted">{item.note}</div>
      </>
    );
  }

  return (
    <>
      <div className="mb-2 flex items-center gap-2 text-xs text-ink-muted">
        <Sparkles size={14} className="text-sage" />
        AI 回答 · {item.query}
      </div>
      <div className="break-words text-sm leading-6 text-ink-muted">由 AI 生成，仅供参考。{item.answer}</div>
    </>
  );
}
