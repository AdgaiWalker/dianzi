import React from 'react';
import { Search, Sparkles, BookOpen } from 'lucide-react';
import { ThemeMode } from '@/types';
import { ToolCard, ArticleCard } from '../CardComponents';
import { NormalSearchResult } from '@/hooks/useAISearch';

interface NormalResultPanelProps {
  result: NormalSearchResult;
  themeMode: ThemeMode;
  onToolClick: (id: string) => void;
  onArticleClick: (id: string) => void;
}

/**
 * 普通搜索结果面板
 *
 * 展示关键词匹配的工具和文章列表，包含空状态处理。
 */
export const NormalResultPanel: React.FC<NormalResultPanelProps> = ({
  result,
  themeMode,
  onToolClick,
  onArticleClick,
}) => (
  <div className="space-y-8">
    {/* 结果统计 */}
    <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 px-3 py-2 rounded-lg w-fit">
      <span>找到 {result.tools.length} 个工具</span>
      <span className="w-1 h-1 rounded-full bg-slate-300"></span>
      <span>{result.articles.length} 篇内容</span>
    </div>

    {/* 空状态 */}
    {result.tools.length === 0 && result.articles.length === 0 && (
      <div className="text-center py-12 text-slate-400">
        <Search size={48} className="mx-auto mb-4 opacity-20" />
        <p>未找到相关结果，换个关键词试试？</p>
      </div>
    )}

    {/* 工具结果 */}
    {result.tools.length > 0 && (
      <div>
        <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
          <Sparkles size={16} /> 工具结果
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {result.tools.map(tool => (
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

    {/* 内容结果 */}
    {result.articles.length > 0 && (
      <div>
        <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
          <BookOpen size={16} /> 内容结果
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {result.articles.map(article => (
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
);
