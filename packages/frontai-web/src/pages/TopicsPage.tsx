import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Layers, LoaderCircle, Search } from 'lucide-react';
import type { Domain, Topic } from '@dianzi/shared';
import { getErrorMessage } from '@dianzi/shared';
import { compassApi } from '@/services/api';
import { useAppStore } from '@/store/useAppStore';

const domainLabels: Record<Domain, string> = { creative: '创意', dev: '开发', work: '办公' };

export function TopicsPage() {
  const navigate = useNavigate();
  const { themeMode } = useAppStore();
  const isEyeCare = themeMode === 'eye-care';
  const [items, setItems] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [domain, setDomain] = useState<Domain | 'all'>('all');
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    compassApi
      .listTopics()
      .then((result) => {
        if (!cancelled) setItems(result.items);
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err, '专题加载失败'));
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
      .filter((item) => !keyword || `${item.title} ${item.description}`.toLowerCase().includes(keyword))
      .sort((a, b) => b.articleCount - a.articleCount);
  }, [domain, items, query]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
            <Layers size={14} />
            专题库
          </div>
          <h1 className={`text-3xl font-extrabold md:text-4xl ${isEyeCare ? 'text-stone-900' : 'text-slate-950'}`}>
            按问题链路浏览 AI 方法
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
            每个专题把工具、教程和场景串成一条可执行路径，适合需要系统学习而不是只找单个工具的用户。
          </p>
        </div>
        <label className="relative block">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
            placeholder="搜索专题关键词"
          />
        </label>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {(['all', 'creative', 'dev', 'work'] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setDomain(value)}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${
              domain === value ? 'bg-slate-950 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            {value === 'all' ? '全部专题' : domainLabels[value]}
          </button>
        ))}
      </div>

      {loading && <StateLine icon={<LoaderCircle className="animate-spin" size={18} />} text="正在加载专题..." />}
      {error && <StateLine icon={<AlertTriangle size={18} />} text={error} tone="error" />}

      {!loading && !error && (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((topic) => (
            <button
              key={topic.id}
              type="button"
              onClick={() => navigate(`/topics/${topic.id}`)}
              className={`group overflow-hidden rounded-2xl border text-left transition hover:-translate-y-1 hover:shadow-xl ${
                isEyeCare ? 'border-stone-200 bg-eye-care-card' : 'border-slate-100 bg-white'
              }`}
            >
              <div className="aspect-[16/9] overflow-hidden bg-slate-100">
                <img src={topic.coverUrl} alt={topic.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
              </div>
              <div className="p-5">
                <div className="mb-3 flex items-center justify-between text-xs">
                  <span className="rounded-full bg-slate-100 px-2 py-1 font-bold text-slate-500">{domainLabels[topic.domain]}</span>
                  <span className="text-slate-400">{topic.articleCount} 篇内容</span>
                </div>
                <h2 className="text-lg font-extrabold text-slate-900">{topic.title}</h2>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{topic.description}</p>
                <div className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-blue-600">
                  查看专题 <ArrowRight size={15} />
                </div>
              </div>
            </button>
          ))}
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
