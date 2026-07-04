import React from 'react';
import { Sparkles, AlertTriangle } from 'lucide-react';
import { AISearchResultV2 } from '@ns/shared';
import { Tool, Article, ThemeMode } from '@/types';
import { ToolCard, ArticleCard } from '../CardComponents';

interface AIResultPanelProps {
  aiResult: AISearchResultV2;
  recommendedTools: Tool[];
  recommendedArticles: Article[];
  themeMode: ThemeMode;
  onToolClick: (id: string) => void;
  onArticleClick: (id: string) => void;
}

/**
 * AI 搜索结果面板
 *
 * 展示 AI 生成的推荐方案、建议路径、推荐工具和相关文章。
 */
export const AIResultPanel: React.FC<AIResultPanelProps> = ({
  aiResult,
  recommendedTools,
  recommendedArticles,
  themeMode,
  onToolClick,
  onArticleClick,
}) => {
  const isEyeCare = themeMode === 'eye-care';
  const isDemoMode = aiResult.mode === 'demo';

  // 演示模式下剥离前缀
  const summaryText = aiResult.summary || '';
  const displaySummary = isDemoMode
    ? summaryText.replace(/^演示模式[:：]\s*/, '')
    : summaryText;

  return (
    <>
      {/* 演示模式提示 */}
      {isDemoMode && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-amber-50 text-amber-800 px-4 py-3 border border-amber-100">
          <AlertTriangle size={18} className="shrink-0" />
          <div className="text-sm font-medium">{aiResult.summary}</div>
        </div>
      )}

      {/* AI 推荐方案 */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <h4 className="text-sm font-bold uppercase tracking-wider text-blue-600">AI 推荐方案</h4>
          <span className="inline-flex items-center gap-1 text-xs text-slate-400">
            <Sparkles size={10} />
            由 AI 生成，仅供参考
          </span>
        </div>
        <p className={`text-lg leading-relaxed font-medium mb-4 ${isEyeCare ? 'text-stone-800' : 'text-slate-800'}`}>
          {displaySummary}
        </p>
        <div className={`p-4 rounded-xl text-sm leading-relaxed ${isEyeCare ? 'bg-amber-50 text-stone-700' : 'bg-slate-50 text-slate-600'}`}>
          <span className="font-bold block mb-1">建议路径:</span>
          {aiResult.recommendation}
        </div>
      </div>

      {/* 推荐工具与文章 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {recommendedTools.length > 0 && (
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">推荐工具</h4>
            <div className="space-y-4">
              {recommendedTools.map(tool => (
                <ToolCard
                  key={tool.id}
                  tool={tool}
                  themeMode={themeMode}
                  onClick={() => onToolClick(tool.id)}
                />
              ))}
            </div>
          </div>
        )}

        {recommendedArticles.length > 0 && (
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">相关文章</h4>
            <div className="space-y-4">
              {recommendedArticles.map(article => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  themeMode={themeMode}
                  onClick={() => onArticleClick(article.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};
