import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Calendar, ExternalLink, Globe, LoaderCircle } from 'lucide-react';
import type { CompassNewsRecord, Domain } from '@ns/shared';
import { getErrorMessage } from '@ns/shared';
import ReactMarkdown from 'react-markdown';
import { compassApi } from '@/services/api';

const domainLabels: Record<Domain, string> = { creative: '创意', dev: '开发', work: '办公' };

export function NewsDetailPage() {
  const { newsId } = useParams<{ newsId: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<CompassNewsRecord | null>(null);
  const [key, setKey] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!newsId) return;
    let cancelled = false;
    compassApi
      .getNews(newsId)
      .then((result) => {
        if (!cancelled) {
          setItem(result);
          setKey(newsId);
          setError('');
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setItem(null);
          setKey(newsId);
          setError(getErrorMessage(err, '资讯加载失败'));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [newsId]);

  const loading = Boolean(newsId) && key !== newsId;

  if (loading) {
    return <StatePanel icon={<LoaderCircle className="animate-spin" size={18} />} text="正在加载资讯..." />;
  }

  if (!newsId || error || !item) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <BackButton onClick={() => navigate('/news')} />
        <StatePanel icon={<AlertTriangle size={18} />} text={error || '未找到资讯'} tone="error" />
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-3xl px-4 py-8">
      <BackButton onClick={() => navigate('/news')} />
      <header className="mb-8 border-b border-slate-200 pb-8">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-blue-50 px-2.5 py-1 font-bold text-blue-700">{domainLabels[item.domain]}</span>
          <span className="inline-flex items-center gap-1 text-slate-400">
            <Globe size={12} />
            {item.source}
          </span>
          <span className="inline-flex items-center gap-1 text-slate-400">
            <Calendar size={12} />
            {new Date(item.publishedAt).toLocaleDateString('zh-CN')}
          </span>
        </div>
        <h1 className="text-3xl font-extrabold leading-tight text-slate-950 md:text-4xl">{item.title}</h1>
        <p className="mt-4 text-base leading-7 text-slate-500">{item.summary}</p>
        {item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            查看来源 <ExternalLink size={15} />
          </a>
        )}
      </header>
      <div className="prose prose-slate max-w-none">
        <ReactMarkdown>{item.body || item.summary}</ReactMarkdown>
      </div>
    </article>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="mb-6 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900">
      <ArrowLeft size={16} /> 返回资讯
    </button>
  );
}

function StatePanel({ icon, text, tone = 'normal' }: { icon: ReactNode; text: string; tone?: 'normal' | 'error' }) {
  return (
    <div className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-12 text-sm ${
      tone === 'error' ? 'border-rose-100 bg-rose-50 text-rose-700' : 'border-slate-200 bg-white text-slate-500'
    }`}>
      {icon}
      {text}
    </div>
  );
}
