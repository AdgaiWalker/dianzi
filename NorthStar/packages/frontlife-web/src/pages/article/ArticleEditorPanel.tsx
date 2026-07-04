import { LoaderCircle } from 'lucide-react';

interface ArticleEditorPanelProps {
  title: string;
  summary: string;
  content: string;
  submitting: boolean;
  error: string;
  onTitleChange: (value: string) => void;
  onSummaryChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export function ArticleEditorPanel({
  title,
  summary,
  content,
  submitting,
  error,
  onTitleChange,
  onSummaryChange,
  onContentChange,
  onSubmit,
  onCancel,
}: ArticleEditorPanelProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-ink-secondary">标题</label>
        <input
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          className="w-full rounded-lg border border-border bg-bg-subtle px-3 py-2 text-sm outline-none focus:border-sage"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-ink-secondary">摘要</label>
        <input
          value={summary}
          onChange={(event) => onSummaryChange(event.target.value)}
          placeholder="文章摘要（可选）"
          className="w-full rounded-lg border border-border bg-bg-subtle px-3 py-2 text-sm outline-none focus:border-sage"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-ink-secondary">内容（支持 Markdown）</label>
        <textarea
          value={content}
          onChange={(event) => onContentChange(event.target.value)}
          rows={15}
          className="w-full resize-none rounded-lg border border-border bg-bg-subtle px-3 py-2 text-sm font-mono outline-none focus:border-sage"
        />
      </div>
      {error && <div className="text-sm text-rose-custom">{error}</div>}
      <div className="flex gap-2">
        <button
          onClick={onSubmit}
          disabled={submitting}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-sage px-4 text-sm font-medium text-white disabled:bg-ink-faint"
        >
          {submitting && <LoaderCircle size={15} className="mr-1.5 animate-spin" />}
          保存更改
        </button>
        <button
          onClick={onCancel}
          disabled={submitting}
          className="inline-flex h-10 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium text-ink-secondary hover:bg-bg-subtle"
        >
          取消
        </button>
      </div>
    </div>
  );
}
