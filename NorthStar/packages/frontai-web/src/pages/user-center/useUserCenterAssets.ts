import { useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '@ns/shared';
import type { Article, Tool, UserSolution } from '@/types';
import { compassApi } from '@/services/api';
import { toUserSolution } from '@/utils/solution';

export interface UserCenterAssets {
  key: string;
  solutions: UserSolution[];
  tools: Tool[];
  articles: Article[];
  error: string;
}

const emptyAssets: UserCenterAssets = { key: '', solutions: [], tools: [], articles: [], error: '' };

export function useUserCenterAssets(isLoggedIn: boolean, setFavoriteToolIds: (ids: string[]) => void) {
  const [solutionState, setSolutionState] = useState<UserCenterAssets>(emptyAssets);
  const [favoriteArticleIds, setFavoriteArticleIds] = useState<Set<string>>(new Set());
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!isLoggedIn) return;
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    let cancelled = false;

    Promise.all([compassApi.listSolutions(), compassApi.listTools(), compassApi.listFavorites(), compassApi.listArticles()])
      .then(([solutionResult, toolResult, favoriteResult, articleResult]) => {
        if (cancelled || requestIdRef.current !== requestId) return;
        setFavoriteToolIds(favoriteResult.items.filter((item) => item.targetType === 'tool').map((item) => item.targetId));
        setFavoriteArticleIds(new Set(favoriteResult.items.filter((item) => item.targetType === 'article').map((item) => item.targetId)));
        setSolutionState({
          key: 'loaded',
          solutions: solutionResult.items.map(toUserSolution),
          tools: toolResult.items,
          articles: articleResult.items,
          error: '',
        });
      })
      .catch((error) => {
        if (cancelled || requestIdRef.current !== requestId) return;
        setSolutionState({
          key: 'loaded',
          solutions: [],
          tools: [],
          articles: [],
          error: getErrorMessage(error, '方案资产加载失败，请稍后重试。'),
        });
      });

    return () => {
      cancelled = true;
      requestIdRef.current += 1;
    };
  }, [isLoggedIn, setFavoriteToolIds]);

  return { solutionState, setSolutionState, favoriteArticleIds, setFavoriteArticleIds };
}
