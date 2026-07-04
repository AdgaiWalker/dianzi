import React from 'react';
import { Filter, CheckCircle2, X, Zap } from 'lucide-react';
import type { ThemeMode } from '@/types';

export type FilterCategory = 'all' | 'creative' | 'dev' | 'work';
export type SortOption = 'trending' | 'rating' | 'popular' | 'newest';

const CATEGORY_LABELS: Record<FilterCategory, string> = {
  all: '全部工具',
  creative: '创意设计',
  dev: '开发编程',
  work: '效率办公',
};

const SORT_LABELS: Record<SortOption, string> = {
  trending: '趋势推荐',
  rating: '评分最高',
  popular: '使用最多',
  newest: '最新上架',
};

export { CATEGORY_LABELS, SORT_LABELS };

interface FilterBarProps {
  selectedCategory: FilterCategory;
  selectedSort: SortOption;
  showFilters: boolean;
  themeMode: ThemeMode;
  onCategoryChange: (category: FilterCategory) => void;
  onSortChange: (sort: SortOption) => void;
  onToggleFilters: () => void;
  onClearAll: () => void;
}

/** 筛选与排序栏：标题 + 筛选按钮 + 分类/排序面板 + 已选标签 */
export const FilterBar: React.FC<FilterBarProps> = ({
  selectedCategory,
  selectedSort,
  showFilters,
  themeMode,
  onCategoryChange,
  onSortChange,
  onToggleFilters,
  onClearAll,
}) => {
  const isEyeCare = themeMode === 'eye-care';
  const hasActiveFilters = selectedCategory !== 'all' || selectedSort !== 'trending';

  return (
    <>
      {/* 标题与筛选按钮 */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Zap className="text-blue-600" size={20} />
            <h1 className="text-2xl font-bold">工具展览馆</h1>
          </div>

          <button
            onClick={onToggleFilters}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${
              showFilters
                ? 'bg-blue-600 text-white'
                : isEyeCare
                  ? 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Filter size={16} />
            筛选与排序
          </button>
        </div>

        {/* 分类与排序面板 */}
        {showFilters && (
          <div className={`mt-6 p-6 rounded-2xl ${isEyeCare ? 'bg-eye-care-card shadow-sm' : 'bg-white shadow-lg'} animate-in fade-in slide-in-from-top-2 duration-300`}>
            <div className="flex flex-col md:flex-row gap-6">
              {/* 分类筛选 */}
              <div className="flex-1">
                <div className="text-sm font-semibold text-slate-700 mb-3">按领域筛选</div>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(CATEGORY_LABELS) as FilterCategory[]).map((category) => (
                    <button
                      key={category}
                      onClick={() => onCategoryChange(category)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        selectedCategory === category
                          ? 'bg-blue-600 text-white shadow-md'
                          : isEyeCare
                            ? 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {selectedCategory === category && <CheckCircle2 size={12} className="inline mr-1" />}
                      {CATEGORY_LABELS[category]}
                    </button>
                  ))}
                </div>
              </div>

              {/* 排序选项 */}
              <div className="flex-1">
                <div className="text-sm font-semibold text-slate-700 mb-3">排序方式</div>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(SORT_LABELS) as SortOption[]).map((sort) => (
                    <button
                      key={sort}
                      onClick={() => onSortChange(sort)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        selectedSort === sort
                          ? 'bg-purple-600 text-white shadow-md'
                          : isEyeCare
                            ? 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {SORT_LABELS[sort]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 当前筛选标签 */}
      {hasActiveFilters && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-slate-500">当前筛选：</span>
            {selectedCategory !== 'all' && (
              <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                {CATEGORY_LABELS[selectedCategory]}
                <button onClick={() => onCategoryChange('all')} className="hover:bg-blue-200 rounded-full p-0.5">
                  <X size={14} />
                </button>
              </span>
            )}
            {selectedSort !== 'trending' && (
              <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm">
                {SORT_LABELS[selectedSort]}
                <button onClick={() => onSortChange('trending')} className="hover:bg-purple-200 rounded-full p-0.5">
                  <X size={14} />
                </button>
              </span>
            )}
            <button
              onClick={onClearAll}
              className="text-sm text-slate-500 hover:text-slate-700 underline"
            >
              清除全部
            </button>
          </div>
        </section>
      )}
    </>
  );
};
