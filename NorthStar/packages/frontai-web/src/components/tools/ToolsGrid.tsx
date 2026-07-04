import React from 'react';
import { Search, Sparkles, ArrowRight } from 'lucide-react';
import type { Tool, ThemeMode } from '@/types';
import { ToolCard } from '../CardComponents';

interface ToolsGridProps {
  tools: Tool[];
  themeMode: ThemeMode;
  isToolFavorited: (id: string) => boolean;
  onToolClick: (tool: Tool) => void;
  onToggleFavorite: (id: string) => void;
  onCtaClick: () => void;
}

/** 工具网格 + 底部 CTA 引导区 */
export const ToolsGrid: React.FC<ToolsGridProps> = ({
  tools,
  themeMode,
  isToolFavorited,
  onToolClick,
  onToggleFavorite,
  onCtaClick,
}) => {
  const isEyeCare = themeMode === 'eye-care';

  return (
    <>
      {/* 工具网格 */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {tools.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <div className="mb-4"><Search size={48} className="mx-auto text-slate-300" /></div>
            <p className="text-lg">没有找到匹配的工具</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {tools.map((tool) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                onClick={() => onToolClick(tool)}
                themeMode={themeMode}
                isFavorited={isToolFavorited(tool.id)}
                onToggleFavorite={() => onToggleFavorite(tool.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* CTA 引导区 */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-16">
        <div className={`rounded-3xl p-8 md:p-12 text-center ${
          isEyeCare
            ? 'bg-eye-care-card shadow-sm'
            : 'bg-gradient-to-br from-blue-600 to-purple-600 shadow-2xl'
        }`}>
          <h2 className={`text-2xl md:text-3xl font-bold mb-4 ${isEyeCare ? 'text-stone-800' : 'text-white'}`}>
            找不到合适的工具？
          </h2>
          <p className={`mb-6 ${isEyeCare ? 'text-stone-600' : 'text-white/90'}`}>
            使用 AI 搜索功能，告诉我们您的需求，智能推荐最适合的工具组合
          </p>
          <button
            onClick={onCtaClick}
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all hover:shadow-lg ${
              isEyeCare
                ? 'bg-stone-800 text-white hover:bg-stone-700'
                : 'bg-white text-blue-600 hover:bg-white/90'
            }`}
          >
            <Sparkles size={18} />
            开始 AI 搜索
            <ArrowRight size={18} />
          </button>
        </div>
      </section>
    </>
  );
};
