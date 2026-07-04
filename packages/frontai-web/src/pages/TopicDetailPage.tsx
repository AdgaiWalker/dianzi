import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, ArrowRight, FileText, LoaderCircle, Sparkles, Wrench } from 'lucide-react';
import type { Article, Tool, Topic } from '@dianzi/shared';
import { getErrorMessage } from '@dianzi/shared';
import { compassApi } from '@/services/api';
import { ArticleCard, ToolCard } from '@/components/CardComponents';
import { useAppStore } from '@/store/useAppStore';

type TopicState = {
  key: string;
  topic: Topic | null;
  articles: Article[];
  tools: Tool[];
  error: string;
};

export function TopicDetailPage() {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();
  const { themeMode, selectedToolIds, toggleToolSelection, isToolFavorited, isArticleFavorited } = useAppStore();
  const [state, setState] = useState<TopicState>({ key: '', topic: null, articles: [], tools: [], error: '' });

  useEffect(() => {
    if (!topicId) return;
    let cancelled = false;
    Promise.all([compassApi.getTopic(topicId), compassApi.listArticles(), compassApi.listTools()])
      .then(([topic, articleResult, toolResult]) => {
        if (cancelled) return;
        const articles = articleResult.items.filter((article) => article.topicId === topic.id);
        const toolIds = new Set(articles.map((article) => article.relatedToolId).filter(Boolean));
        setState({
          key: topicId,
          topic,
          articles,
          tools: toolResult.items.filter((tool) => toolIds.has(tool.id)),
          error: '',
        });
      })
      .catch((err) => {
        if (!cancelled) setState({ key: topicId, topic: null, articles: [], tools: [], error: getErrorMessage(err, '专题加载失败') });
      });
    return () => {
      cancelled = true;
    };
  }, [topicId]);

  const loading = Boolean(topicId) && state.key !== topicId;
  const selectedFromTopic = useMemo(() => state.tools.map((tool) => tool.id).slice(0, 3), [state.tools]);

  if (loading) {
    return <StatePanel icon={<LoaderCircle className="animate-spin" size={18} />} text="正在加载专题..." />;
  }

  if (!topicId || state.error || !state.topic) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <button onClick={() => navigate('/topics')} className="mb-6 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900">
          <ArrowLeft size={16} /> 返回专题
        </button>
        <StatePanel icon={<AlertTriangle size={18} />} text={state.error || '未找到专题'} tone="error" />
      </div>
    );
  }

  const topic = state.topic;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <button onClick={() => navigate('/topics')} className="mb-6 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900">
        <ArrowLeft size={16} /> 返回专题
      </button>

      <section className="mb-8 overflow-hidden rounded-3xl bg-slate-950 text-white shadow-xl">
        <div className="grid lg:grid-cols-[1fr_420px]">
          <div className="p-7 md:p-10">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-blue-100">
              <Sparkles size={14} />
              {topic.articleCount} 篇内容
            </div>
            <h1 className="text-3xl font-extrabold md:text-5xl">{topic.title}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 md:text-base">{topic.description}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate(`/solution/new?tools=${encodeURIComponent(selectedFromTopic.join(','))}`)}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-500"
              >
                开始方案 <ArrowRight size={16} />
              </button>
              {state.articles[0] && (
                <button
                  type="button"
                  onClick={() => navigate(`/article/${state.articles[0].id}?topicId=${topic.id}`)}
                  className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-5 py-3 text-sm font-bold text-white hover:bg-white/15"
                >
                  阅读第一篇 <FileText size={16} />
                </button>
              )}
            </div>
          </div>
          <div className="min-h-72 overflow-hidden bg-slate-800">
            <img src={topic.coverUrl} alt={topic.title} className="h-full w-full object-cover opacity-90" />
          </div>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <section>
          <div className="mb-4 flex items-center gap-2">
            <FileText size={18} className="text-blue-600" />
            <h2 className="text-xl font-extrabold text-slate-900">专题文章</h2>
          </div>
          <div className="space-y-4">
            {state.articles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                themeMode={themeMode}
                isFavorited={isArticleFavorited(article.id)}
                onClick={() => navigate(`/article/${article.id}?topicId=${topic.id}`)}
              />
            ))}
            {state.articles.length === 0 && <div className="rounded-2xl border border-slate-200 bg-white px-5 py-10 text-center text-sm text-slate-500">该专题暂无文章。</div>}
          </div>
        </section>

        <aside>
          <div className="mb-4 flex items-center gap-2">
            <Wrench size={18} className="text-blue-600" />
            <h2 className="text-xl font-extrabold text-slate-900">关联工具</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {state.tools.map((tool) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                themeMode={themeMode}
                isSelected={selectedToolIds.has(tool.id)}
                isFavorited={isToolFavorited(tool.id)}
                onClick={() => navigate(`/tool/${tool.id}`)}
                onToggleSelection={(event) => {
                  event.stopPropagation();
                  toggleToolSelection(tool.id);
                }}
              />
            ))}
            {state.tools.length === 0 && <div className="rounded-2xl border border-slate-200 bg-white px-5 py-8 text-sm text-slate-500">暂无关联工具。</div>}
          </div>
        </aside>
      </div>
    </div>
  );
}

function StatePanel({ icon, text, tone = 'normal' }: { icon: ReactNode; text: string; tone?: 'normal' | 'error' }) {
  return (
    <div className={`mx-auto mt-8 flex max-w-5xl items-center justify-center gap-2 rounded-2xl border px-4 py-12 text-sm ${
      tone === 'error' ? 'border-rose-100 bg-rose-50 text-rose-700' : 'border-slate-200 bg-white text-slate-500'
    }`}>
      {icon}
      {text}
    </div>
  );
}
