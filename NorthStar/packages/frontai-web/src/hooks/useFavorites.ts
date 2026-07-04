import { useEffect } from 'react';
import { compassApi } from '@/services/api';
import { useAppStore } from '@/store/useAppStore';

/** 加载当前用户收藏列表，按类型设置到 store */
export function useLoadFavorites() {
  const isLoggedIn = useAppStore((s) => s.isLoggedIn);
  const setFavoriteToolIds = useAppStore((s) => s.setFavoriteToolIds);
  const setFavoriteArticleIds = useAppStore((s) => s.setFavoriteArticleIds);

  useEffect(() => {
    if (!isLoggedIn) return;
    compassApi
      .listFavorites()
      .then((result) => {
        const toolIds = result.items.filter((f) => f.targetType === 'tool').map((f) => f.targetId);
        const articleIds = result.items.filter((f) => f.targetType === 'article').map((f) => f.targetId);
        setFavoriteToolIds(toolIds);
        setFavoriteArticleIds(articleIds);
      })
      .catch((error) => { console.error('[useLoadFavorites] 加载收藏失败:', error); });
  }, [isLoggedIn, setFavoriteToolIds, setFavoriteArticleIds]);
}

/** 切换收藏状态：调用 API + 更新 store */
export function useToggleFavorite() {
  const isToolFavorited = useAppStore((s) => s.isToolFavorited);
  const isArticleFavorited = useAppStore((s) => s.isArticleFavorited);
  const toggleFavoriteTool = useAppStore((s) => s.toggleFavoriteTool);
  const toggleFavoriteArticle = useAppStore((s) => s.toggleFavoriteArticle);

  const toggleFavorite = async (
    targetType: 'tool' | 'article' | 'topic',
    targetId: string,
    currentlyFavorited: boolean,
  ) => {
    try {
      if (currentlyFavorited) {
        await compassApi.removeFavorite({ targetType, targetId });
      } else {
        await compassApi.addFavorite({ targetType, targetId });
      }
      if (targetType === 'tool') toggleFavoriteTool(targetId);
      if (targetType === 'article') toggleFavoriteArticle(targetId);
    } catch (error) { console.error('[useToggleFavorite] 操作失败:', error); }
  };

  return { toggleFavorite, isToolFavorited, isArticleFavorited };
}
