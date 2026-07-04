import { useState, useRef, useCallback, useMemo, useEffect, type FormEvent } from 'react';
import { searchToolsWithAI } from '@/services/AIService';
import { buildFallbackResult } from '@/services/aiFallback';
import { AISearchResultV2, checkSensitiveWords } from '@dianzi/shared';
import { Tool, Article, LibraryMode } from '@/types';
import { UI_DELAY } from '@/constants/ui';

/** 普通搜索结果结构 */
export interface NormalSearchResult {
  tools: Tool[];
  articles: Article[];
}

/** hook 返回的公共状态与操作 */
export interface UseAISearchReturn {
  // 查询状态
  query: string;
  setQuery: (q: string) => void;
  loading: boolean;
  isExpanded: boolean;

  // 模式
  searchMode: 'ai' | 'normal';
  libraryMode: LibraryMode;

  // 结果
  aiResult: AISearchResultV2 | null;
  normalResult: NormalSearchResult | null;
  recommendedTools: Tool[];
  recommendedArticles: Article[];

  // 操作
  handleSearch: (e: FormEvent) => Promise<void>;
  handleModeChange: (newMode: 'ai' | 'normal') => Promise<void>;
  handleLibraryModeChange: (newLibMode: LibraryMode) => Promise<void>;
  handleClose: () => void;
}

interface UseAISearchOptions {
  tools: Tool[];
  articles: Article[];
  initialQuery?: string;
}

/** 根据库模式过滤数据 */
function filterByLibraryMode(
  tools: Tool[],
  articles: Article[],
  libMode: LibraryMode,
) {
  if (libMode === 'professional') {
    return {
      filteredTools: tools,
      filteredArticles: articles.filter(a => a.isFeatured),
    };
  }
  return { filteredTools: tools, filteredArticles: articles };
}

/**
 * AI 搜索核心逻辑 hook
 *
 * 管理查询、模式切换、搜索执行、结果状态等所有搜索相关逻辑，
 * 与 UI 完全解耦，方便独立测试。
 */
export function useAISearch({ tools, articles, initialQuery }: UseAISearchOptions): UseAISearchReturn {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchMode, setSearchMode] = useState<'ai' | 'normal'>('ai');
  const [libraryMode, setLibraryMode] = useState<LibraryMode>('professional');
  const [lastSearchedQuery, setLastSearchedQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  // AI 搜索结果
  const [aiResult, setAiResult] = useState<AISearchResultV2 | null>(null);
  // 普通搜索结果
  const [normalResult, setNormalResult] = useState<NormalSearchResult | null>(null);

  // 请求序号，用于取消过期请求
  const searchSeq = useRef(0);

  // 初始化查询
  useEffect(() => {
    if (initialQuery) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  /** 执行搜索 */
  const performSearch = useCallback(async (
    mode: 'ai' | 'normal',
    q: string,
    libMode: LibraryMode = libraryMode,
  ) => {
    if (!q.trim()) return;

    // 敏感词输入拦截
    const sensitive = checkSensitiveWords(q);
    if (sensitive.hit) {
      setIsExpanded(true);
      const { filteredTools, filteredArticles } = filterByLibraryMode(tools, articles, libMode);
      setAiResult(buildFallbackResult('sensitive_blocked', q, filteredTools, filteredArticles));
      setNormalResult(null);
      return;
    }

    const seq = ++searchSeq.current;
    setLoading(true);
    setIsExpanded(true);

    // 模拟延迟（接入真实 AI API 后移除）
    await new Promise(resolve => setTimeout(resolve, UI_DELAY.AI_SEARCH_SIMULATE));
    if (seq !== searchSeq.current) return;

    const { filteredTools, filteredArticles } = filterByLibraryMode(tools, articles, libMode);

    if (mode === 'ai') {
      const aiResponse = await searchToolsWithAI(q, filteredTools, filteredArticles);
      if (seq !== searchSeq.current) return;
      setAiResult(aiResponse);
      setNormalResult(null);
    } else {
      const needle = q.toLowerCase();
      const matchedTools = filteredTools.filter(t =>
        `${t.name} ${t.description} ${(t.tags || []).join(' ')}`.toLowerCase().includes(needle),
      );
      const matchedArticles = filteredArticles.filter(a =>
        `${a.title} ${a.summary}`.toLowerCase().includes(needle),
      );
      if (seq !== searchSeq.current) return;
      setNormalResult({ tools: matchedTools, articles: matchedArticles });
      setAiResult(null);
    }

    setLoading(false);
  }, [tools, articles, libraryMode]);

  /** 提交搜索 */
  const handleSearch = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;

    setLastSearchedQuery(q);
    await performSearch(searchMode, q);
  }, [query, searchMode, performSearch]);

  /** 切换搜索模式并重新搜索 */
  const handleModeChange = useCallback(async (newMode: 'ai' | 'normal') => {
    setSearchMode(newMode);

    const q = query.trim();
    if (!q || !lastSearchedQuery || q !== lastSearchedQuery) return;

    await performSearch(newMode, q);
  }, [query, lastSearchedQuery, performSearch]);

  /** 切换库模式并重新搜索 */
  const handleLibraryModeChange = useCallback(async (newLibMode: LibraryMode) => {
    setLibraryMode(newLibMode);

    const q = query.trim();
    if (!q || !lastSearchedQuery || q !== lastSearchedQuery || searchMode !== 'ai') return;

    await performSearch('ai', q, newLibMode);
  }, [query, lastSearchedQuery, searchMode, performSearch]);

  /** 关闭搜索结果 */
  const handleClose = useCallback(() => {
    setIsExpanded(false);
    setQuery('');
    setAiResult(null);
    setNormalResult(null);
  }, []);

  // AI 结果中的推荐工具
  const recommendedTools = useMemo(() =>
    aiResult?.suggestedTools
      .map(name => tools.find(t => t.name.includes(name) || name.includes(t.name)))
      .filter((t): t is Tool => !!t) || [],
    [aiResult, tools],
  );

  // AI 结果中的推荐文章
  const recommendedArticles = useMemo(() =>
    aiResult?.suggestedArticles
      .map(title => articles.find(a => a.title.includes(title) || title.includes(a.title)))
      .filter((a): a is Article => !!a) || [],
    [aiResult, articles],
  );

  return {
    query, setQuery, loading, isExpanded,
    searchMode, libraryMode,
    aiResult, normalResult,
    recommendedTools, recommendedArticles,
    handleSearch, handleModeChange, handleLibraryModeChange, handleClose,
  };
}
