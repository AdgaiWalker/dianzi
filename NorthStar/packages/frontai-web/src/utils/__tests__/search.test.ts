import { describe, it, expect } from 'vitest';
import { fuzzyMatchTools, fuzzyMatchArticles, mapSuggestionsToTools, mapSuggestionsToArticles } from '../search';
import type { Tool, Article } from '@/types';

const tools: Tool[] = [
  {
    id: 't1', name: 'ChatGPT', description: 'AI 对话助手', fullDescription: '',
    domain: 'creative', tags: ['chat', 'ai'], rating: 4.8, usageCount: '10M',
    imageUrl: '', url: '', isFavorite: false,
  },
  {
    id: 't2', name: 'Midjourney', description: 'AI 图像生成', fullDescription: '',
    domain: 'dev', tags: ['art', 'creative'], rating: 4.5, usageCount: '5M',
    imageUrl: '', url: '', isFavorite: false,
  },
];

const articles: Article[] = [
  {
    id: 'a1', title: '如何使用 ChatGPT', summary: '一篇关于 ChatGPT 的入门教程',
    content: '', domain: 'creative', author: 'Alice', date: '2024-01-01',
    readTime: '5 min', imageUrl: '', isVideo: false, isFeatured: true,
    stats: { views: 100, likes: 10, comments: 2 },
  },
  {
    id: 'a2', title: 'Midjourney 进阶技巧', summary: '图像生成的高级参数',
    content: '', domain: 'dev', author: 'Bob', date: '2024-02-01',
    readTime: '8 min', imageUrl: '', isVideo: false, isFeatured: false,
    stats: { views: 50, likes: 5, comments: 1 },
  },
];

describe('fuzzyMatchTools', () => {
  it('按名称匹配工具', () => {
    expect(fuzzyMatchTools('chat', tools)).toHaveLength(1);
    expect(fuzzyMatchTools('chat', tools)[0].id).toBe('t1');
  });

  it('按描述匹配工具', () => {
    expect(fuzzyMatchTools('图像', tools)).toHaveLength(1);
    expect(fuzzyMatchTools('图像', tools)[0].id).toBe('t2');
  });

  it('按标签匹配工具', () => {
    expect(fuzzyMatchTools('creative', tools)).toHaveLength(1);
  });

  it('无匹配时返回空数组', () => {
    expect(fuzzyMatchTools('xyz', tools)).toHaveLength(0);
  });

  it('空查询返回所有工具', () => {
    expect(fuzzyMatchTools('', tools)).toHaveLength(2);
  });
});

describe('fuzzyMatchArticles', () => {
  it('按标题匹配文章', () => {
    expect(fuzzyMatchArticles('ChatGPT', articles)).toHaveLength(1);
    expect(fuzzyMatchArticles('ChatGPT', articles)[0].id).toBe('a1');
  });

  it('按摘要匹配文章', () => {
    expect(fuzzyMatchArticles('高级', articles)).toHaveLength(1);
  });

  it('无匹配时返回空数组', () => {
    expect(fuzzyMatchArticles('nonexistent', articles)).toHaveLength(0);
  });
});

describe('mapSuggestionsToTools', () => {
  it('将建议名匹配到工具', () => {
    const result = mapSuggestionsToTools(['ChatGPT', 'Midjourney'], tools);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('t1');
    expect(result[1].id).toBe('t2');
  });

  it('过滤无法匹配的建议', () => {
    const result = mapSuggestionsToTools(['ChatGPT', 'UnknownTool'], tools);
    expect(result).toHaveLength(1);
  });

  it('空建议返回空数组', () => {
    expect(mapSuggestionsToTools([], tools)).toHaveLength(0);
  });
});

describe('mapSuggestionsToArticles', () => {
  it('将建议标题匹配到文章', () => {
    const result = mapSuggestionsToArticles(['如何使用 ChatGPT'], articles);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('a1');
  });

  it('部分匹配也生效', () => {
    const result = mapSuggestionsToArticles(['Midjourney'], articles);
    expect(result).toHaveLength(1);
  });
});
