import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { ArticleSummary } from '@/services/api';
import { groupArticles } from '@/utils/article';

interface ArticleTreeProps {
  articles: ArticleSummary[];
}

export default function ArticleTree({ articles }: ArticleTreeProps) {
  const { parents, childrenByParent } = useMemo(() => groupArticles(articles), [articles]);

  return (
    <aside className="sticky top-[72px] hidden max-h-[calc(100vh-88px)] overflow-y-auto rounded-2xl border border-border-light bg-bg-subtle p-4 lg:block">
      <div className="mb-3 text-xs font-semibold tracking-wider text-ink-muted">文章树</div>
      <div className="space-y-2">
        {parents.length === 0 && (
          <div className="rounded-lg bg-white px-3 py-2 text-sm text-ink-muted">暂无文章</div>
        )}
        {parents.map((article) => {
          const children = childrenByParent.get(article.id) ?? [];
          return (
            <div key={article.id}>
              <Link to={`/article/${article.id}`} className="block rounded-lg px-3 py-2 text-sm leading-5 text-ink-secondary hover:bg-white hover:text-sage">
                {article.title}
              </Link>
              {children.length > 0 && (
                <div className="ml-3 mt-1 space-y-1 border-l border-sage-light pl-2">
                  {children.map((child) => (
                    <Link key={child.id} to={`/article/${child.id}`} className="block rounded-md px-2 py-1.5 text-xs text-ink-muted hover:bg-white hover:text-sage">
                      {child.title}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
