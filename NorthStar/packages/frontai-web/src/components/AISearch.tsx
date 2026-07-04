import React from 'react';
import { Sparkles, Loader2, ArrowRight, Search, Library, Layers } from 'lucide-react';
import { Tool, Article, ThemeMode } from '@/types';
import { useAISearch } from '@/hooks/useAISearch';
import { AIResultPanel } from './search/AIResultPanel';
import { NormalResultPanel } from './search/NormalResultPanel';

interface AISearchProps {
  tools: Tool[];
  articles: Article[];
  onToolClick: (id: string) => void;
  onArticleClick: (id: string) => void;
  themeMode: ThemeMode;
  initialQuery?: string;
}

/**
 * AI 搜索组件
 *
 * 纯组合层：消费 useAISearch hook 管理搜索状态，
 * 组合 AIResultPanel / NormalResultPanel 渲染结果。
 */
export const AISearch: React.FC<AISearchProps> = ({
  tools,
  articles,
  onToolClick,
  onArticleClick,
  themeMode,
  initialQuery,
}) => {
  const {
    query, setQuery, loading, isExpanded,
    searchMode, libraryMode,
    aiResult, normalResult,
    recommendedTools, recommendedArticles,
    handleSearch, handleModeChange, handleLibraryModeChange, handleClose,
  } = useAISearch({ tools, articles, initialQuery });

  const isEyeCare = themeMode === 'eye-care';

  return (
    <div className="w-full max-w-4xl mx-auto mb-12">
      <div className={`relative z-10 rounded-2xl transition-all duration-500 overflow-hidden
        ${isExpanded
          ? (isEyeCare ? 'bg-eye-care-card shadow-lg ring-1 ring-stone-200' : 'bg-white shadow-xl ring-1 ring-slate-200')
          : 'bg-transparent'
        }`}
      >
        {/* 搜索输入区 */}
        <form onSubmit={handleSearch} className="relative group">
          <div className={`absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-20 transition-opacity duration-500 ${isExpanded ? 'opacity-0' : 'group-hover:opacity-30'}`}></div>
          <div className={`relative flex items-center p-2 rounded-2xl transition-all duration-300
             ${!isExpanded ? (isEyeCare ? 'bg-eye-care-card shadow-md border border-stone-200' : 'bg-white shadow-lg border border-slate-100') : ''}
          `}>
            {/* 搜索模式切换 */}
            <div className="relative flex items-center pl-2 pr-1">
              <button
                type="button"
                onClick={() => handleModeChange(searchMode === 'ai' ? 'normal' : 'ai')}
                className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 ${
                  searchMode === 'ai'
                    ? 'bg-blue-50 ring-1 ring-blue-100 shadow-sm hover:bg-blue-100'
                    : 'bg-slate-100 ring-1 ring-slate-200 hover:bg-slate-200'
                }`}
                title={searchMode === 'ai' ? '当前: AI 搜索，点击切换为普通搜索' : '当前: 普通搜索，点击切换为 AI 搜索'}
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  searchMode === 'ai'
                    ? <Sparkles size={16} className="text-blue-600" />
                    : <Search size={16} className="text-slate-500" />
                )}
              </button>

              {/* AI 模式下显示库模式切换 */}
              {searchMode === 'ai' && (
                <button
                  type="button"
                  onClick={() => handleLibraryModeChange(libraryMode === 'professional' ? 'comprehensive' : 'professional')}
                  className={`ml-1 flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 ${
                    libraryMode === 'professional'
                      ? 'bg-indigo-50 ring-1 ring-indigo-100 hover:bg-indigo-100'
                      : 'bg-emerald-50 ring-1 ring-emerald-100 hover:bg-emerald-100'
                  }`}
                  title={libraryMode === 'professional' ? '当前: 专业库（精选内容），点击切换为综合库' : '当前: 综合库（全量内容），点击切换为专业库'}
                >
                  {libraryMode === 'professional'
                    ? <Library size={16} className="text-indigo-600" />
                    : <Layers size={16} className="text-emerald-600" />
                  }
                </button>
              )}

              {/* 分隔线 */}
              <div className="w-px h-6 bg-slate-100 mx-2"></div>
            </div>

            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchMode === 'ai' ? "我想学剪辑短视频..." : "输入关键词搜索工具或文章..."}
              className={`w-full p-4 bg-transparent border-none outline-none text-lg placeholder:text-slate-400 ${isEyeCare ? 'text-stone-800' : 'text-slate-800'}`}
            />
            <button
              type="submit"
              disabled={loading}
              className="p-3 bg-slate-900 text-white rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowRight size={20} />
            </button>
          </div>
        </form>

        {/* 结果区域 */}
        {isExpanded && !loading && (
          <div className="p-6 md:p-8 animate-in fade-in slide-in-from-top-4 duration-500">
            {searchMode === 'ai' && aiResult && (
              <AIResultPanel
                aiResult={aiResult}
                recommendedTools={recommendedTools}
                recommendedArticles={recommendedArticles}
                themeMode={themeMode}
                onToolClick={onToolClick}
                onArticleClick={onArticleClick}
              />
            )}

            {searchMode === 'normal' && normalResult && (
              <NormalResultPanel
                result={normalResult}
                themeMode={themeMode}
                onToolClick={onToolClick}
                onArticleClick={onArticleClick}
              />
            )}

            <button
              onClick={handleClose}
              className="mt-8 w-full py-3 text-sm text-slate-400 hover:bg-slate-50 rounded-lg transition-colors"
            >
              关闭搜索结果
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
