import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle, LoaderCircle, Sparkles } from 'lucide-react';
import type { ArticleSummary } from '@/services/api';
import { articlesApi } from '@/services/api';

interface AIWritingPanelProps {
  spaceId: string;
  spaceTitle: string;
  token: string | null;
  userName: string | null;
  canWrite: boolean;
  onArticlePublished: (article: ArticleSummary) => void;
}

export default function AIWritingPanel({
  spaceId,
  spaceTitle,
  token,
  userName,
  canWrite,
  onArticlePublished,
}: AIWritingPanelProps) {
  const navigate = useNavigate();

  const [writingOpen, setWritingOpen] = useState(false);
  const [writingTopic, setWritingTopic] = useState('');
  const [writingReply, setWritingReply] = useState('');
  const [writingDirections, setWritingDirections] = useState<string[]>([]);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftContent, setDraftContent] = useState('');
  const [writingLoading, setWritingLoading] = useState(false);
  const [writingError, setWritingError] = useState('');
  const [writingSuccess, setWritingSuccess] = useState('');
  const [publishingArticle, setPublishingArticle] = useState(false);

  const generateDraft = async () => {
    if (!token) return navigate('/login');
    if (!writingTopic.trim()) return;
    setWritingError('');
    setWritingSuccess('');
    setWritingLoading(true);
    try {
      const result = await articlesApi.generateArticleDraft({
        topic: writingTopic.trim(),
        spaceTitle,
      });
      setWritingReply(result.reply);
      setWritingDirections(result.directions);
      setDraftTitle(result.draft.title);
      setDraftContent(result.draft.content);
    } catch (err) {
      setWritingError(err instanceof Error ? err.message : '草稿生成失败，请稍后重试');
    } finally {
      setWritingLoading(false);
    }
  };

  const publishArticle = async () => {
    if (!token) return navigate('/login');
    if (!draftTitle.trim() || !draftContent.trim()) return;
    setWritingError('');
    setWritingSuccess('');
    setPublishingArticle(true);
    try {
      const result = await articlesApi.createArticle({
        spaceId,
        title: draftTitle.trim(),
        content: `${draftContent.trim()}\n\n> AI 辅助：本文由 AI 草稿辅助生成，发布前请维护者自行核对事实和时效。`,
        authorName: userName ?? '张同学',
      });
      onArticlePublished(result.article);
      setWritingOpen(false);
      setWritingTopic('');
      setWritingReply('');
      setWritingDirections([]);
      setDraftTitle('');
      setDraftContent('');
      setWritingSuccess('文章已发布，已回到当前空间知识区。');
    } catch (err) {
      setWritingError(err instanceof Error ? err.message : '文章发布失败，请检查内容后重试');
    } finally {
      setPublishingArticle(false);
    }
  };

  return (
    <>
      {/* 区域标题与 AI 写作按钮 */}
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-semibold text-ink-secondary">知识体系</h2>
        {token && canWrite && (
          <button onClick={() => setWritingOpen((v) => !v)} className="rounded-lg bg-sage px-3 py-1.5 text-xs font-medium text-white">
            AI 写文章
          </button>
        )}
      </div>

      {/* 成功提示 */}
      {writingSuccess && !writingOpen && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-sage-light bg-sage-light px-4 py-3 text-sm text-sage-dark">
          <CheckCircle size={16} className="shrink-0" />
          {writingSuccess}
        </div>
      )}

      {/* AI 写作面板 */}
      {writingOpen && (
        <div className="mb-4 rounded-2xl border border-border-light bg-surface p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink-secondary">
            <Sparkles size={16} className="text-sage" />
            AI 对话式写作
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-ink-muted sm:grid-cols-4">
            {['主题', '方向', '草稿', '发布'].map((step, index) => (
              <div
                key={step}
                className={[
                  'rounded-lg border px-3 py-2',
                  index === 0 || writingDirections.length > 0
                    ? 'border-sage-light bg-sage-light text-sage-dark'
                    : 'border-border-light bg-bg-subtle',
                ].join(' ')}
              >
                {step}
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              value={writingTopic}
              onChange={(e) => setWritingTopic(e.target.value)}
              placeholder="例如：三食堂烤冷面窗口测评"
              className="h-10 min-w-0 flex-1 rounded-lg border border-border px-3 text-sm outline-none focus:border-sage"
            />
            <button
              onClick={generateDraft}
              disabled={writingLoading || !writingTopic.trim()}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-sage px-4 text-sm font-medium text-white disabled:bg-ink-faint"
            >
              {writingLoading && <LoaderCircle size={15} className="mr-1.5 animate-spin" />}
              生成草稿
            </button>
          </div>
          {writingError && (
            <div className="mt-3 flex gap-2 rounded-xl bg-rose-light p-3 text-sm leading-6 text-rose-custom">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              {writingError}
            </div>
          )}
          {writingReply && <div className="mt-3 rounded-xl bg-sage-light p-3 text-sm leading-6 text-sage-dark">{writingReply}</div>}
          {writingDirections.length > 0 && (
            <div className="mt-3 rounded-xl border border-border-light bg-bg-subtle p-3">
              <div className="mb-2 text-xs font-semibold text-ink-secondary">建议方向</div>
              <div className="space-y-2">
                {writingDirections.map((direction) => (
                  <div key={direction} className="flex gap-2 text-sm leading-6 text-ink-secondary">
                    <CheckCircle size={15} className="mt-1 shrink-0 text-sage" />
                    <span className="min-w-0 break-words">{direction}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {draftContent && (
            <div className="mt-3 space-y-2">
              <input
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                className="h-10 w-full rounded-lg border border-border px-3 text-sm font-semibold outline-none focus:border-sage"
              />
              <textarea
                value={draftContent}
                onChange={(e) => setDraftContent(e.target.value)}
                className="h-56 w-full resize-none rounded-lg border border-border px-3 py-2 text-sm leading-6 outline-none focus:border-sage"
              />
              <button
                onClick={publishArticle}
                disabled={publishingArticle || !draftTitle.trim() || !draftContent.trim()}
                className="inline-flex w-full items-center justify-center rounded-lg bg-sage px-4 py-2 text-sm font-medium text-white disabled:bg-ink-faint sm:w-auto"
              >
                {publishingArticle && <LoaderCircle size={15} className="mr-1.5 animate-spin" />}
                发布文章
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
