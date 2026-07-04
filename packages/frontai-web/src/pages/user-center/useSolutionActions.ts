import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { getErrorMessage } from '@dianzi/shared';
import type { UserSolution } from '@/types';
import { compassApi } from '@/services/api';
import { downloadTextFile } from '@/utils/export';
import type { UserCenterAssets } from './useUserCenterAssets';

interface UseSolutionActionsInput {
  solutionToDelete: string | null;
  setSolutionToDelete: (id: string | null) => void;
  viewSolution: UserSolution | null;
  setViewSolution: (solution: UserSolution | null) => void;
  setSolutionState: Dispatch<SetStateAction<UserCenterAssets>>;
  favoriteToolIds: Set<string>;
  setFavoriteToolIds: (ids: string[]) => void;
  setFavoriteArticleIds: Dispatch<SetStateAction<Set<string>>>;
}

export function useSolutionActions({
  solutionToDelete,
  setSolutionToDelete,
  viewSolution,
  setViewSolution,
  setSolutionState,
  favoriteToolIds,
  setFavoriteToolIds,
  setFavoriteArticleIds,
}: UseSolutionActionsInput) {
  const [removeError, setRemoveError] = useState('');

  const handleDeleteConfirm = async () => {
    if (!solutionToDelete) return;
    try {
      await compassApi.deleteSolution(solutionToDelete);
      setSolutionState((cur) => ({
        ...cur,
        solutions: cur.solutions.filter((solution) => solution.id !== solutionToDelete),
      }));
      if (viewSolution?.id === solutionToDelete) setViewSolution(null);
    } catch (error) {
      setSolutionState((cur) => ({
        ...cur,
        error: getErrorMessage(error, '方案删除失败，请稍后重试。'),
      }));
    } finally {
      setSolutionToDelete(null);
    }
  };

  const handleExportSolution = async (solution: UserSolution, format: 'md' | 'txt' | 'csv') => {
    try {
      const content = await compassApi.exportSolution(solution.id, format);
      downloadTextFile(`${solution.title}.${format}`, content);
    } catch (error) {
      setSolutionState((cur) => ({
        ...cur,
        error: getErrorMessage(error, '方案导出失败，请稍后重试。'),
      }));
    }
  };

  const handleRemoveFavorite = async (toolId: string) => {
    try {
      await compassApi.removeFavorite({ targetType: 'tool', targetId: toolId });
      setFavoriteToolIds(Array.from(favoriteToolIds).filter((id) => id !== toolId));
    } catch (error) {
      setRemoveError(getErrorMessage(error, '取消收藏失败，请稍后重试。'));
    }
  };

  const handleRemoveArticleFavorite = async (articleId: string) => {
    try {
      await compassApi.removeFavorite({ targetType: 'article', targetId: articleId });
      setFavoriteArticleIds((prev) => {
        const next = new Set(prev);
        next.delete(articleId);
        return next;
      });
    } catch (error) {
      setRemoveError(getErrorMessage(error, '取消收藏失败，请稍后重试。'));
    }
  };

  return {
    removeError,
    handleDeleteConfirm,
    handleExportSolution,
    handleRemoveFavorite,
    handleRemoveArticleFavorite,
  };
}
