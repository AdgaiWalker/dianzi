import type { ArticleSummary } from '@/services/api';

export function groupArticles(articles: ArticleSummary[]) {
  const parents = articles.filter((a) => !a.parentId);
  const childrenByParent = new Map<string, ArticleSummary[]>();
  for (const a of articles) {
    if (a.parentId) {
      const list = childrenByParent.get(a.parentId) ?? [];
      list.push(a);
      childrenByParent.set(a.parentId, list);
    }
  }
  return { parents, childrenByParent };
}
