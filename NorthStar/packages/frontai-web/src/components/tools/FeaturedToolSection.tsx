import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Star,
  Users,
  ExternalLink,
  Heart,
  Sparkles,
  TrendingUp,
  Award,
} from 'lucide-react';
import type { Tool, Article, ThemeMode } from '@/types';

// 分类标签映射（与父页面共享）
const CATEGORY_LABELS: Record<string, string> = {
  all: '全部工具',
  creative: '创意设计',
  dev: '开发编程',
  work: '效率办公',
};

interface FeaturedToolSectionProps {
  featuredTool: Tool;
  articles: Article[];
  totalTools: number;
  themeMode: ThemeMode;
  isFavorited: boolean;
  onToggleFavorite: () => void;
}

/** 精选工具推荐区：展示本周推荐工具、推荐理由、相关教程、平台数据 */
export const FeaturedToolSection: React.FC<FeaturedToolSectionProps> = ({
  featuredTool,
  articles,
  totalTools,
  themeMode,
  isFavorited,
  onToggleFavorite,
}) => {
  const navigate = useNavigate();
  const isEyeCare = themeMode === 'eye-care';

  // 获取与精选工具相关的文章
  const relatedArticles = articles
    .filter((article) => article.relatedToolId === featuredTool.id)
    .slice(0, 3);

  return (
    <section className="relative mb-12 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-600/10" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="text-blue-600" size={20} />
          <span className="text-sm font-semibold text-blue-600">本周推荐</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 精选工具主卡片 */}
          <div
            className="relative rounded-3xl overflow-hidden shadow-2xl group cursor-pointer"
            onClick={() => navigate(`/tool/${featuredTool.id}`)}
          >
            <div className="aspect-[16/10] lg:aspect-[16/9] relative">
              <img
                src={featuredTool.imageUrl}
                alt={featuredTool.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-end p-8 text-white">
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-blue-600 px-3 py-1 rounded-full text-sm font-semibold">
                    {CATEGORY_LABELS[featuredTool.domain] ?? featuredTool.domain}
                  </span>
                  <div className="flex items-center gap-1 bg-black/30 backdrop-blur-md px-2 py-1 rounded">
                    <Star size={14} className="text-amber-400 fill-amber-400" />
                    <span className="text-sm font-bold">{featuredTool.rating}</span>
                  </div>
                  <div className="flex items-center gap-1 bg-black/30 backdrop-blur-md px-2 py-1 rounded">
                    <Users size={14} />
                    <span className="text-sm">{featuredTool.usageCount}</span>
                  </div>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-3">{featuredTool.name}</h2>
                <p className="text-white/90 text-base line-clamp-2 mb-4">{featuredTool.fullDescription}</p>
                <div className="flex items-center gap-2">
                  <a
                    href={featuredTool.url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-xl font-semibold hover:bg-white/90 transition-colors"
                  >
                    访问官网 <ExternalLink size={16} />
                  </a>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite();
                    }}
                    className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-5 py-2.5 rounded-xl font-semibold hover:bg-white/30 transition-colors"
                  >
                    <Heart size={16} className={isFavorited ? 'fill-rose-500 text-rose-500' : ''} />
                    {isFavorited ? '已收藏' : '收藏'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 右侧信息面板 */}
          <div className="flex flex-col gap-6">
            {/* 推荐理由 */}
            <div className={`rounded-2xl p-6 ${isEyeCare ? 'bg-eye-care-card shadow-sm' : 'bg-white shadow-lg'}`}>
              <h3 className="flex items-center gap-2 font-bold text-lg mb-4">
                <Award className="text-amber-500" size={20} />
                推荐理由
              </h3>
              <p className="text-slate-600 leading-relaxed">
                {featuredTool.name} 是 {CATEGORY_LABELS[featuredTool.domain] ?? featuredTool.domain} 领域中备受好评的工具，
                评分高达 <span className="font-bold text-amber-600">{featuredTool.rating}</span> 分，
                已有 <span className="font-bold">{featuredTool.usageCount}</span> 位用户在使用。
                {featuredTool.tags.length > 0 && (
                  <> 适用于 {featuredTool.tags.slice(0, 2).join('、')} 等多种场景。</>
                )}
              </p>
            </div>

            {/* 相关教程 */}
            {relatedArticles.length > 0 && (
              <div className={`rounded-2xl p-6 ${isEyeCare ? 'bg-eye-care-card shadow-sm' : 'bg-white shadow-lg'}`}>
                <h3 className="flex items-center gap-2 font-bold text-lg mb-4">
                  <Sparkles className="text-blue-500" size={20} />
                  相关教程
                </h3>
                <div className="space-y-3">
                  {relatedArticles.map((article) => (
                    <button
                      key={article.id}
                      onClick={() => navigate(`/article/${article.id}`)}
                      className="w-full text-left p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                    >
                      <div className="font-medium text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1">
                        {article.title}
                      </div>
                      <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                        <span>{article.readTime}</span>
                        <span>•</span>
                        <span>{article.stats.views} 浏览</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 平台数据 */}
            <div className={`rounded-2xl p-6 ${isEyeCare ? 'bg-eye-care-card shadow-sm' : 'bg-white shadow-lg'}`}>
              <h3 className="flex items-center gap-2 font-bold text-lg mb-4">
                <TrendingUp className="text-green-500" size={20} />
                平台数据
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-slate-50 rounded-xl">
                  <div className="text-2xl font-bold text-blue-600">{totalTools}</div>
                  <div className="text-xs text-slate-500 mt-1">收录工具</div>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-xl">
                  <div className="text-2xl font-bold text-purple-600">
                    {articles.filter((a) => a.relatedToolId).length}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">相关教程</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
