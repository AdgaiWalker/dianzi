import React from 'react';
import {
  Save,
  Send,
  ArrowLeft,
  LoaderCircle,
  Eye,
  AlertTriangle,
  CheckCircle,
  Sparkles,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { MarkdownEditor } from '@/components/MarkdownEditor';
import { ContentEditorSidebar } from '@/components/ContentEditorSidebar';
import ReactMarkdown from 'react-markdown';
import {
  useContentEditor,
  CONTENT_TYPE_OPTIONS,
  DOMAIN_OPTIONS,
} from '@/hooks/useContentEditor';

export const ContentStudioEditPage: React.FC = () => {
  const { themeMode } = useAppStore();
  const isEyeCare = themeMode === 'eye-care';

  const {
    isNew,
    navigate,
    form,
    setTitle,
    setSummary,
    setDomain,
    setContentType,
    setSlug,
    setBody,
    markDirty,
    loading,
    saving,
    submitting,
    error,
    success,
    previewMode,
    setPreviewMode,
    canSubmit,
    existingData,
    editorRef,
    handleSave,
    handleSubmit,
  } = useContentEditor();

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center py-20">
          <LoaderCircle className="mx-auto mb-4 animate-spin text-slate-400" size={32} />
          <p className="text-slate-400">正在加载...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-5xl mx-auto px-4 py-8 animate-in fade-in ${isEyeCare ? 'bg-eye-care-card min-h-screen' : ''}`}>
      {/* 顶部导航 */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-4"
        >
          <ArrowLeft size={16} /> 返回
        </button>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <Sparkles size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold">{isNew ? '新建内容' : '编辑内容'}</h1>
              <p className="text-sm text-slate-500">创建并管理您的创意内容</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                previewMode
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Eye size={16} />
              {previewMode ? '编辑' : '预览'}
            </button>
            <button
              onClick={handleSave}
              disabled={saving || submitting}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}
              保存
            </button>
            {(isNew || existingData?.status !== 'published') && (
              <button
                onClick={handleSubmit}
                disabled={submitting || saving || !canSubmit}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
                提交审核
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 反馈消息 */}
      {error && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 flex items-center gap-2">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 flex items-center gap-2">
          <CheckCircle size={16} />
          {success}
        </div>
      )}

      {/* 主体内容 */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* 编辑区域 */}
        <div className={`lg:col-span-2 space-y-6 ${isEyeCare ? 'bg-white border border-stone-200' : 'bg-white border border-slate-100'} rounded-2xl p-6`}>
          {/* 内容类型 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              内容类型 <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-3">
              {CONTENT_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setContentType(opt.value); markDirty(); }}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    form.contentType === opt.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Slug <span className="text-red-500">*</span>
            </label>
            <input
              value={form.slug}
              onChange={(e) => { setSlug(e.target.value); markDirty(); }}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              placeholder="例如 ai-writing-guide"
            />
          </div>

          {/* 标题 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              标题 <span className="text-red-500">*</span>
            </label>
            <input
              value={form.title}
              onChange={(e) => { setTitle(e.target.value); markDirty(); }}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              placeholder="输入内容标题"
            />
          </div>

          {/* 摘要 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              摘要 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.summary}
              onChange={(e) => { setSummary(e.target.value); markDirty(); }}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none"
              placeholder="简要描述内容概要"
            />
          </div>

          {/* 领域 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">领域</label>
            <div className="flex gap-3">
              {DOMAIN_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setDomain(opt.value); markDirty(); }}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    form.domain === opt.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 正文编辑 / 预览 */}
          {previewMode ? (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">预览</label>
              <div className={`p-6 rounded-xl border ${isEyeCare ? 'border-stone-200 bg-stone-50' : 'border-slate-200 bg-slate-50'}`}>
                <div className="prose max-w-none">
                  <ReactMarkdown>{form.body || '暂无内容'}</ReactMarkdown>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                内容 <span className="text-red-500">*</span>
              </label>
              <MarkdownEditor
                ref={editorRef}
                value={form.body}
                onChange={(value) => { setBody(value); markDirty(); }}
                onSave={handleSave}
              />
            </div>
          )}
        </div>

        {/* 侧边栏 */}
        <ContentEditorSidebar
          isEyeCare={isEyeCare}
          canSubmit={canSubmit}
          existingData={existingData}
        />
      </div>
    </div>
  );
};
