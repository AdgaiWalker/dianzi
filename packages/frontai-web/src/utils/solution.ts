import type { SolutionRecord } from '@dianzi/shared';
import type { UserSolution } from '@/types';

export function toUserSolution(record: SolutionRecord): UserSolution {
  return {
    id: record.id,
    title: record.title,
    targetGoal: record.targetGoal,
    toolIds: record.toolIds,
    aiAdvice: record.content,
    createdAt: new Date(record.createdAt).toLocaleDateString('zh-CN'),
  };
}
