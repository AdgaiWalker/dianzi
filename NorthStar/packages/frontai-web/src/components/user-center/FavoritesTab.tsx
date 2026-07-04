import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Heart, Star, Wrench, X } from 'lucide-react';
import type { Tool, Article } from '@/types';

interface FavoritesTabProps {
  tools: Tool[];
  articles: Article[];
  favoriteToolIds: Set<string>;
  favoriteArticleIds: Set<string>;
  isEyeCare: boolean;
  navigate: ReturnType<typeof useNavigate>;
  onRemoveFavoriteTool: (toolId: string) => void;
  onRemoveFavoriteArticle: (articleId: string) => void;
  onToggleToolSelection: (toolId: string) => void;
}

export const FavoritesTab: React.FC<FavoritesTabProps> = ({
  tools, articles, favoriteToolIds, favoriteArticleIds,
  isEyeCare, navigate,
  onRemoveFavoriteTool, onRemoveFavoriteArticle, onToggleToolSelection,
}) => {
  const cardClass = isEyeCare ? 'bg-white border border-stone-200' : 'bg-white border border-slate-100 shadow-sm';

  const favTools = tools.filter((t) => favoriteToolIds.has(t.id));
  const favArticles = articles.filter((a) => favoriteArticleIds.has(a.id));

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><Heart size={24} /> 我的收藏</h2>

      {/* 工具收藏 */}
      <section className="mb-8">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2"><Wrench size={14} /> 收藏工具 ({favTools.length})</h3>
        {favTools.length === 0 ? (
          <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-2xl">
            <Star className="mx-auto mb-2 opacity-50" size={28} />
            <p className="text-sm">还没有收藏工具</p>
            <button onClick={() => navigate('/')} className="mt-3 text-blue-600 font-bold text-sm hover:underline">去发现</button>
          </div>
        ) : (
          <div className="space-y-3">
            {favTools.map((tool) => (
              <div key={tool.id} className={`p-4 rounded-xl ${cardClass} flex items-center gap-4 group`}>
                <img src={tool.imageUrl} className="w-12 h-12 rounded-lg object-cover bg-slate-100 flex-shrink-0" alt={tool.name} />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm">{tool.name}</div>
                  <div className="text-xs text-slate-500 truncate">{tool.description}</div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => onToggleToolSelection(tool.id)} className="px-3 py-1.5 text-xs font-bold bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                    用于 AI 方案
                  </button>
                  <button onClick={() => onRemoveFavoriteTool(tool.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="取消收藏">
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 文章收藏 */}
      <section>
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2"><BookOpen size={14} /> 收藏文章 ({favArticles.length})</h3>
        {favArticles.length === 0 ? (
          <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-2xl">
            <BookOpen className="mx-auto mb-2 opacity-50" size={28} />
            <p className="text-sm">还没有收藏文章</p>
            <button onClick={() => navigate('/library')} className="mt-3 text-blue-600 font-bold text-sm hover:underline">去浏览</button>
          </div>
        ) : (
          <div className="space-y-3">
            {favArticles.map((article) => (
              <div key={article.id} className={`p-4 rounded-xl ${cardClass} flex items-start gap-4 group`}>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm mb-1">{article.title}</div>
                  <div className="text-xs text-slate-500 line-clamp-2">{article.summary}</div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                    <span>{article.author}</span>
                    <span>{article.readTime}</span>
                  </div>
                </div>
                <button onClick={() => onRemoveFavoriteArticle(article.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0" title="取消收藏">
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
