import { describe, it, expect } from 'vitest';
import { toUserSolution } from '../solution';
import type { SolutionRecord } from '@dianzi/shared';

const record: SolutionRecord = {
  id: 'sol-1',
  userId: 'user-1',
  title: '测试方案',
  targetGoal: '提升效率',
  toolIds: ['t1', 't2'],
  content: '## 建议\n\n- 使用 ChatGPT',
  createdAt: '2024-06-15T10:30:00Z',
};

describe('toUserSolution', () => {
  it('正确映射所有字段', () => {
    const result = toUserSolution(record);
    expect(result.id).toBe('sol-1');
    expect(result.title).toBe('测试方案');
    expect(result.targetGoal).toBe('提升效率');
    expect(result.toolIds).toEqual(['t1', 't2']);
    expect(result.aiAdvice).toBe('## 建议\n\n- 使用 ChatGPT');
  });

  it('将 ISO 日期转为本地化字符串', () => {
    const result = toUserSolution(record);
    expect(typeof result.createdAt).toBe('string');
    expect(result.createdAt.length).toBeGreaterThan(0);
  });
});
