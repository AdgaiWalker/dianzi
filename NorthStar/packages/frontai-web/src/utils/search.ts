import type { Tool, Article } from '@/types';

export function fuzzyMatchTools(query: string, tools: Tool[]): Tool[] {
  const needle = query.toLowerCase();
  return tools.filter((t) =>
    `${t.name} ${t.description} ${(t.tags ?? []).join(' ')}`.toLowerCase().includes(needle),
  );
}

export function fuzzyMatchArticles(query: string, articles: Article[]): Article[] {
  const needle = query.toLowerCase();
  return articles.filter((a) => `${a.title} ${a.summary}`.toLowerCase().includes(needle));
}

export function mapSuggestionsToTools(suggestions: string[], tools: Tool[]): Tool[] {
  return suggestions
    .map((name) => tools.find((t) => t.name.includes(name) || name.includes(t.name)))
    .filter((t): t is Tool => !!t);
}

export function mapSuggestionsToArticles(suggestions: string[], articles: Article[]): Article[] {
  return suggestions
    .map((title) => articles.find((a) => a.title.includes(title) || title.includes(a.title)))
    .filter((a): a is Article => !!a);
}
