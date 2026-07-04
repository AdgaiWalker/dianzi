import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, BookOpen, LoaderCircle, Search } from 'lucide-react';
import type { Article, Domain } from '@dianzi/shared';
import { getErrorMessage } from '@dianzi/shared';
import { compassApi } from '@/services/api';
import { ArticleCard } from '@/components/CardComponents';
import { useAppStore } from '@/store/useAppStore';

const domainLabels: Record<Domain, string> = { creative: '创意', dev: '开发', work: '办公' };

export function ArticlesPage() {
  const navigate = useNavigate();
  const { themeMode, isArticleFavorited } = useAppStore();
  const [items, setItems] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [domain, setDomain] = useState<Domain | 'all'>('all');
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    compassApi
      .listArticles()
      .then((result) => {
        if (!cancelled) setItems(result.items);
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err, '文章加载失败'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return items
      .filter((item) => domain === 'all' || item.domain === domain)
      .filter((item) => !keyword || `${item.title} ${item.summary} ${item.author}`.toLowerCase().includes(keyword));
  }, [domain, items, query]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white">
          <BookOpen size={14} />
          文章库
        </div>
        <h1 className="text-3xl font-extrabold text-slate-950 md:text-4xl">从真实场景学习 AI 用法</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">筛选教程、案例和复盘，快速找到能直接迁移到工作流里的方法。</p>
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-[1fr_auto]">
        <label className="relative block">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
            placeholder="搜索文章、作者或摘要"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          {(['all', 'creative', 'dev', 'work'] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setDomain(value)}
              className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                domain === value ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              {value === 'all' ? '全部' : domainLabels[value]}
            </button>
          ))}
        </div>
      </div>

      {loading && <StateLine icon={<LoaderCircle className="animate-spin" size={18} />} text="正在加载文章..." />}
      {error && <StateLine icon={<AlertTriangle size={18} />} text={error} tone="error" />}

      {!loading && !error && (
        <div className="space-y-4">
          {filtered.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              themeMode={themeMode}
              isFavorited={isArticleFavorited(article.id)}
              onClick={() => navigate(`/article/${article.id}${article.topicId ? `?topicId=${article.topicId}` : ''}`)}
            />
          ))}
          {filtered.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-16 text-center text-sm text-slate-500">没有匹配的文章。</div>
          )}
        </div>
      )}
    </div>
  );
}

function StateLine({ icon, text, tone = 'normal' }: { icon: ReactNode; text: string; tone?: 'normal' | 'error' }) {
  return (
    <div className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-12 text-sm ${
      tone === 'error' ? 'border-rose-100 bg-rose-50 text-rose-700' : 'border-slate-200 bg-white text-slate-500'
    }`}>
      {icon}
      {text}
    </div>
  );
}
