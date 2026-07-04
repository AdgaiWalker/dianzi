import { describe, it, expect } from 'vitest';
import { groupArticles } from '../article';
import type { ArticleSummary } from '@/services/api';

const base: Omit<ArticleSummary, 'id' | 'parentId' | 'title'> = {
  slug: '', spaceId: 'food', summary: '', helpfulCount: 0,
  changedCount: 0, readCount: 0, favoriteCount: 0,
  confirmedAt: null, updatedAt: '',
};

const articles: ArticleSummary[] = [
  { ...base, id: 'a1', title: '父文章', parentId: null },
  { ...base, id: 'a2', title: '子文章1', parentId: 'a1' },
  { ...base, id: 'a3', title: '子文章2', parentId: 'a1' },
  { ...base, id: 'a4', title: '独立文章', parentId: null },
];

describe('groupArticles', () => {
  it('分离父文章和子文章', () => {
    const { parents } = groupArticles(articles);
    expect(parents).toHaveLength(2);
    expect(parents.map((a) => a.id)).toEqual(['a1', 'a4']);
  });

  it('正确映射子文章到父文章', () => {
    const { childrenByParent } = groupArticles(articles);
    expect(childrenByParent.get('a1')).toHaveLength(2);
    expect(childrenByParent.get('a1')?.map((a) => a.id)).toEqual(['a2', 'a3']);
  });

  it('无子文章的父文章不出现 childrenByParent key', () => {
    const { childrenByParent } = groupArticles(articles);
    expect(childrenByParent.has('a4')).toBe(false);
  });

  it('空输入返回空结果', () => {
    const { parents, childrenByParent } = groupArticles([]);
    expect(parents).toHaveLength(0);
    expect(childrenByParent.size).toBe(0);
  });
});
