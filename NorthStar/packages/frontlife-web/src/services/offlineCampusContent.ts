import { SEED_ARTICLES } from '@ns/shared';
import type {
  ArticleDetail,
  ArticleSummary,
  FeedResponse,
  FrontlifeFeedItem,
  SearchResponse,
  SpaceSummary,
} from '@ns/shared';

const now = '2026-05-20T00:00:00.000Z';

const categoryMeta: Record<string, { title: string; description: string; iconName: string }> = {
  arrival: { title: '新生报到', description: '报到、宿舍、校园卡和开学第一周清单。', iconName: 'MapPinned' },
  food: { title: '校园美食', description: '食堂窗口、周边餐饮和省钱吃饭经验。', iconName: 'Utensils' },
  academic: { title: '学习办事', description: '选课、图书馆、证明办理和教务流程。', iconName: 'BookOpen' },
  print: { title: '打印复印', description: '打印店、材料准备和常见文件处理。', iconName: 'Printer' },
  transport: { title: '校园出行', description: '校内路线、公交地铁和共享单车经验。', iconName: 'Bus' },
  shopping: { title: '省钱采购', description: '教材、二手、生活用品和避坑建议。', iconName: 'ShoppingBag' },
  activity: { title: '社团活动', description: '社团招新、比赛讲座和志愿活动。', iconName: 'Users' },
  pitfalls: { title: '校园避坑', description: '办卡、消费、兼职和安全提醒。', iconName: 'ShieldAlert' },
  secondhand: { title: '二手闲置', description: '闲置转让、教材流转和毕业清仓。', iconName: 'RefreshCw' },
  admin: { title: '教务办理', description: '学生卡、成绩单、档案和毕业手续。', iconName: 'ClipboardList' },
};

const categoryAliases: Record<string, string> = {
  admin: 'academic',
};

const seededArticles = SEED_ARTICLES.map((article) => ({
  ...article,
  category: categoryAliases[article.category] ?? article.category,
}));

function toSummary(article: (typeof seededArticles)[number]): ArticleSummary {
  return {
    id: article.id,
    slug: article.id,
    spaceId: article.category,
    parentId: null,
    title: article.title,
    summary: article.summary,
    helpfulCount: article.likes,
    changedCount: 0,
    readCount: article.views,
    favoriteCount: Math.max(0, Math.round(article.likes / 3)),
    confirmedAt: article.publishedAt ?? null,
    updatedAt: article.updatedAt ?? now,
  };
}

function buildSpaces(): SpaceSummary[] {
  const grouped = new Map<string, ReturnType<typeof toSummary>[]>();
  for (const article of seededArticles) {
    const list = grouped.get(article.category) ?? [];
    list.push(toSummary(article));
    grouped.set(article.category, list);
  }

  return Array.from(grouped.entries()).map(([id, articles]) => {
    const meta = categoryMeta[id] ?? { title: id, description: '校园经验与知识库内容。', iconName: 'BookOpen' };
    const helpfulCount = articles.reduce((sum, article) => sum + article.helpfulCount, 0);
    return {
      id,
      slug: id,
      title: meta.title,
      description: meta.description,
      iconName: meta.iconName,
      category: id,
      articleCount: articles.length,
      helpfulCount,
      favoriteCount: Math.max(0, Math.round(helpfulCount / 4)),
      recentActiveAt: articles[0]?.updatedAt ?? now,
      maintainer: { id: 'offline-editor', name: '盘根编辑' },
    };
  });
}

const spaces = buildSpaces();
const articleSummaries = seededArticles.map(toSummary);

function clone<T>(value: T): T {
  return structuredClone(value);
}

function findArticle(id: string) {
  return seededArticles.find((article) => article.id === id || article.id === id.replace(/^article-/, ''));
}

function articleDetail(article: (typeof seededArticles)[number]): ArticleDetail {
  const space = spaces.find((item) => item.id === article.category);
  return {
    ...toSummary(article),
    content: article.content,
    author: { id: 'offline-editor', name: '盘根编辑', helpedCount: article.likes },
    space: {
      id: space?.id ?? article.category,
      title: space?.title ?? article.category,
      iconName: space?.iconName ?? 'BookOpen',
    },
    changeNotes: [],
  };
}

function feedItems(page: number, pageSize: number): FeedResponse {
  if (page > 1) return { items: [], hasMore: false };

  const items: FrontlifeFeedItem[] = articleSummaries.slice(0, pageSize).map((article) => ({
    id: `offline-feed-${article.id}`,
    type: 'article',
    createdAt: article.updatedAt,
    articleId: article.id,
    spaceId: article.spaceId,
    title: article.title,
    summary: article.summary,
    actorName: '盘根编辑',
    helpfulCount: article.helpfulCount,
  }));

  return { items, hasMore: false };
}

function searchLocal(query: string): SearchResponse {
  const needle = query.trim().toLowerCase();
  const match = (value: string) => !needle || value.toLowerCase().includes(needle);
  const articles = articleSummaries.filter((article) => match(`${article.title} ${article.summary}`)).slice(0, 20);
  const matchedSpaces = spaces.filter((space) => match(`${space.title} ${space.description}`)).slice(0, 10);
  return {
    matchStatus: articles.length > 0 || matchedSpaces.length > 0 ? 'partial' : 'none',
    articles: clone(articles),
    posts: [],
    spaces: clone(matchedSpaces),
  };
}

export const offlineCampusContent = {
  listSpaces: () => ({ spaces: clone(spaces) }),
  getSpace: (id: string) => {
    const space = spaces.find((item) => item.id === id || item.slug === id);
    if (!space) return null;
    const articles = articleSummaries.filter((article) => article.spaceId === space.id);
    return { space: clone(space), articles: clone(articles) };
  },
  getArticle: (id: string) => {
    const article = findArticle(id);
    if (!article) return null;
    return {
      article: clone(articleDetail(article)),
      previousArticleId: null,
      nextArticleId: null,
    };
  },
  getFeed: feedItems,
  search: searchLocal,
  getSpacePosts: () => ({ posts: [] }),
};
