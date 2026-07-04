import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoaderCircle, AlertTriangle } from 'lucide-react';
import type { Tool, Article } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { useLoadFavorites, useToggleFavorite } from '@/hooks/useFavorites';
import { compassApi } from '@/services/api';
import { getErrorMessage } from '@ns/shared';
import { FeaturedToolSection } from '../components/tools/FeaturedToolSection';
import { FilterBar } from '../components/tools/FilterBar';
import type { FilterCategory, SortOption } from '../components/tools/FilterBar';
import { ToolsGrid } from '../components/tools/ToolsGrid';

export const ToolsPage: React.FC = () => {
  const navigate = useNavigate();
  const { themeMode, isToolFavorited } = useAppStore();
  const { toggleFavorite } = useToggleFavorite();
  useLoadFavorites();

  const [tools, setTools] = useState<Tool[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('all');
  const [selectedSort, setSelectedSort] = useState<SortOption>('trending');
  const [showFilters, setShowFilters] = useState(false);
  const [featuredTool, setFeaturedTool] = useState<Tool | null>(null);

  // 加载工具与文章数据
  useEffect(() => {
    let cancelled = false;

    Promise.all([compassApi.listTools(), compassApi.listArticles()])
      .then(([toolResult, articleResult]) => {
        if (cancelled) return;
        setTools(toolResult.items);
        setArticles(articleResult.items);
        // 评分最高的工具作为精选推荐
        const topTool = [...toolResult.items].sort((a, b) => b.rating - a.rating)[0];
        setFeaturedTool(topTool || null);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(getErrorMessage(err, '工具数据加载失败，请稍后重试。'));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // 根据分类与排序筛选工具
  const filteredTools = tools
    .filter((tool) => selectedCategory === 'all' || tool.domain === selectedCategory)
    .sort((a, b) => {
      switch (selectedSort) {
        case 'rating':
          return b.rating - a.rating;
        case 'popular':
          return parseInt(b.usageCount) - parseInt(a.usageCount);
        case 'trending':
          // 趋势排序：评分与使用量的综合权重
          return b.rating * parseInt(b.usageCount) - a.rating * parseInt(a.usageCount);
        default:
          return 0;
      }
    });

  // 加载中
  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-12 text-sm text-slate-500">
          <LoaderCircle size={18} className="animate-spin" />
          正在加载工具展览...
        </div>
      </div>
    );
  }

  // 加载失败
  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex items-start gap-2 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-5 text-sm leading-6 text-rose-700">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 pb-32">
      {/* 精选工具推荐 */}
      {featuredTool && (
        <FeaturedToolSection
          featuredTool={featuredTool}
          articles={articles}
          totalTools={tools.length}
          themeMode={themeMode}
          isFavorited={isToolFavorited(featuredTool.id)}
          onToggleFavorite={() => toggleFavorite('tool', featuredTool.id, isToolFavorited(featuredTool.id))}
        />
      )}

      {/* 筛选与排序 */}
      <FilterBar
        selectedCategory={selectedCategory}
        selectedSort={selectedSort}
        showFilters={showFilters}
        themeMode={themeMode}
        onCategoryChange={setSelectedCategory}
        onSortChange={setSelectedSort}
        onToggleFilters={() => setShowFilters((prev) => !prev)}
        onClearAll={() => {
          setSelectedCategory('all');
          setSelectedSort('trending');
        }}
      />

      {/* 工具网格 + CTA */}
      <ToolsGrid
        tools={filteredTools}
        themeMode={themeMode}
        isToolFavorited={isToolFavorited}
        onToolClick={(tool) => navigate(`/tool/${tool.id}`)}
        onToggleFavorite={(id) => toggleFavorite('tool', id, isToolFavorited(id))}
        onCtaClick={() => navigate('/')}
      />
    </div>
  );
};
