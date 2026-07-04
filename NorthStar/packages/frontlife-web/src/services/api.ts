import { getErrorMessage } from '@ns/shared';

import type {
  ArticleDetail,
  ArticleDraftResponse,
  ArticleSummary,
  ApiEnvelope,
  AccountDeletionRequestRecord,
  CampusCapabilityResponse,
  CreateCampusSpaceRequest,
  CreateArticleInput,
  CreatePostInput,
  DataExportResponse,
  FeedResponse,
  IdentityMeResponse,
  IdentitySession,
  LegalDocumentRecord,
  ModerationTaskRecord,
  NotificationRecord,
  PasswordResetConfirmRequest,
  PasswordResetRequest,
  PasswordResetRequestResponse,
  PasswordResetConfirmResponse,
  PostRecord,
  PostReplyRecord,
  ProfileResponse,
  SearchResponse,
  SpaceSummary,
} from '@ns/shared';
import { handleExpiredSession, SESSION_EXPIRED_MESSAGE } from './authSession';
import { trackCampusEvent } from './analyticsService';
import { offlineCampusContent } from './offlineCampusContent';

export type {
  ArticleDetail,
  ArticleDraftResponse,
  ArticleSummary,
  AccountDeletionRequestRecord,
  CreateCampusSpaceRequest,
  CreateArticleInput,
  CreatePostInput,
  DataExportResponse,
  FeedResponse,
  IdentityMeResponse,
  IdentitySession,
  LegalDocumentRecord,
  ModerationTaskRecord,
  NotificationRecord,
  PasswordResetConfirmRequest,
  PasswordResetRequest,
  PasswordResetRequestResponse,
  PasswordResetConfirmResponse,
  PermissionResponse,
  PostRecord,
  PostReplyRecord,
  ProfileResponse,
  SearchResponse,
  SpaceSummary,
} from '@ns/shared';
import { ApiError, extractErrorMessage, createReadableMessage } from '@ns/shared';

type RequestOptions = RequestInit & {
  authIntent?: 'read' | 'write';
};

const baseURL = import.meta.env.VITE_API_BASE_URL ?? '';
const FRONTLIFE_SITE = 'cn';

// T0-1: token 通过 store 注入，不再直接解析 localStorage
let _tokenGetter: (() => string | null) | null = null;

export function initApi(getToken: () => string | null) {
  _tokenGetter = getToken;
}

function getToken() {
  return _tokenGetter?.() ?? null;
}

const toReadableApiMessage = createReadableMessage({
  sessionExpired: SESSION_EXPIRED_MESSAGE,
  forbidden: '当前账号没有权限执行此操作。',
  serverError: '服务暂时不可用，请确认后端服务已启动或稍后重试。',
  networkError: '网络连接失败，请确认后端服务已启动或稍后重试。',
  defaultError: '请求失败，请稍后重试。',
  passthroughMessages: [
    '用户名、邮箱或密码不正确',
    '用户名或邮箱已被使用',
    'invalid username or password',
    'username already exists',
    'Forbidden',
  ],
});

function unwrapEnvelope<T>(payload: ApiEnvelope<T>) {
  if (!payload.ok) {
    throw new ApiError(toReadableApiMessage(payload.error?.message ?? '请求失败，请稍后重试。'), 0);
  }

  return payload.data;
}

function requestEnvelope<T>(path: string, init?: RequestOptions): Promise<T> {
  return request<ApiEnvelope<T>>(path, init).then(unwrapEnvelope);
}

async function request<T>(path: string, init?: RequestOptions): Promise<T> {
  const token = getToken();
  const { authIntent, ...requestInit } = init ?? {};
  let response: Response;

  try {
    response = await fetch(`${baseURL}${path}`, {
      ...requestInit,
      headers: {
        'Content-Type': 'application/json',
        'x-pangen-site': FRONTLIFE_SITE,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...requestInit.headers,
      },
    });
  } catch (err) {
    const message = getErrorMessage(err, '');
    throw new ApiError(toReadableApiMessage(message), 0);
  }

  const payload = (await response.json().catch(() => null)) as T | { error?: string } | null;

  if (!response.ok) {
    const message = extractErrorMessage(payload) ?? `请求失败 (${response.status})`;
    if (response.status === 401) {
      handleExpiredSession(authIntent ?? 'read');
    }
    throw new ApiError(toReadableApiMessage(message, response.status), response.status);
  }

  return sanitizeBlockedMedia(payload) as T;
}

// --- T0-3: namespace 拆分 ---

export const identityApi = {
  register(input: { username: string; email?: string; password: string; consentVersion?: string }) {
    return requestEnvelope<IdentitySession>('/api/identity/register', {
      method: 'POST',
      body: JSON.stringify({ ...input, site: FRONTLIFE_SITE }),
    });
  },

  login(input: { account: string; password: string }) {
    return requestEnvelope<IdentitySession>('/api/identity/login', {
      method: 'POST',
      body: JSON.stringify({ ...input, site: FRONTLIFE_SITE }),
    });
  },

  requestPasswordReset(input: Omit<PasswordResetRequest, 'site'>) {
    return requestEnvelope<PasswordResetRequestResponse>('/api/identity/password-reset/request', {
      method: 'POST',
      body: JSON.stringify({ ...input, site: FRONTLIFE_SITE }),
    });
  },

  confirmPasswordReset(input: PasswordResetConfirmRequest) {
    return requestEnvelope<PasswordResetConfirmResponse>('/api/identity/password-reset/confirm', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  getIdentityMe() {
    return requestEnvelope<IdentityMeResponse>('/api/identity/me');
  },
};

export const spacesApi = {
  listSpaces() {
    return withOfflineFallback(
      () => request<{ spaces: SpaceSummary[] }>('/api/campus/spaces'),
      offlineCampusContent.listSpaces,
    );
  },

  createSpace(input: CreateCampusSpaceRequest) {
    return requestEnvelope<SpaceSummary>('/api/campus/spaces', {
      method: 'POST',
      authIntent: 'write',
      body: JSON.stringify(input),
    }).then((space) => ({ space }));
  },

  getSpace(id: string) {
    return withOfflineFallback(
      () => request<{ space: SpaceSummary; articles: ArticleSummary[] }>(`/api/campus/spaces/${id}`),
      () => {
        const result = offlineCampusContent.getSpace(id);
        if (!result) throw new ApiError('空间加载失败，请稍后重试。', 0);
        return result;
      },
    ).then((result) => {
      trackCampusEvent('campus_space_visit', { spaceId: id, articleCount: result.articles.length });
      return result;
    });
  },

  claimSpace(spaceId: string, reason: string) {
    return requestEnvelope<ModerationTaskRecord>('/api/moderation/tasks', {
      method: 'POST',
      authIntent: 'write',
      body: JSON.stringify({
        site: FRONTLIFE_SITE,
        type: 'space_claim',
        targetType: 'space',
        targetId: spaceId,
        title: '空间认领申请',
        reason,
      }),
    }).then((task) => ({ task }));
  },
};

export const articlesApi = {
  getArticle(id: string) {
    return withOfflineFallback(
      () => request<{
      article: ArticleDetail;
      previousArticleId: string | null;
      nextArticleId: string | null;
      }>(`/api/campus/articles/${id}`),
      () => {
        const result = offlineCampusContent.getArticle(id);
        if (!result) throw new ApiError('文章加载失败，请稍后重试。', 0);
        return result;
      },
    ).then((result) => {
      trackCampusEvent('campus_article_read', { articleId: result.article.id, spaceId: result.article.space.id });
      return result;
    });
  },

  createArticle(input: CreateArticleInput) {
    return request<{ article: ArticleDetail }>('/api/campus/articles', {
      method: 'POST',
      authIntent: 'write',
      body: JSON.stringify(input),
    });
  },

  updateArticle(articleId: string, input: { title?: string; content?: string; summary?: string }) {
    return request<{ article: ArticleDetail }>(`/api/campus/articles/${articleId}`, {
      method: 'PATCH',
      authIntent: 'write',
      body: JSON.stringify(input),
    });
  },

  generateArticleDraft(input: { topic: string; spaceTitle?: string }) {
    return request<{
      mode: 'ai' | 'demo';
      fallbackReason: string;
      choices?: Array<{
        message?: {
          content?: string;
        };
      }>;
    }>('/api/ai-gateway/chat', {
      method: 'POST',
      authIntent: 'write',
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: `请为校园知识库写一篇文章草稿。主题：${input.topic}。空间：${input.spaceTitle ?? '未指定'}。`,
          },
        ],
        goal: input.topic,
        scenario: 'campus_write',
        max_tokens: 1000,
      }),
    }).then((result) => {
      const content = result.choices?.[0]?.message?.content?.trim() || `# ${input.topic}\n\n请补充正文内容。`;
      return {
        reply: result.mode === 'demo' ? 'AI 写作当前处于演示模式，已生成基础草稿。' : '已生成文章草稿。',
        directions: ['核对事实', '补充校园细节', '发布前请人工审核'],
        draft: {
          title: input.topic,
          content,
        },
      } satisfies ArticleDraftResponse;
    });
  },

  markArticleHelpful(articleId: string) {
    return request<{
      articleId: string;
      helpfulCount: number;
      confirmedAt: string;
    }>(`/api/campus/articles/${articleId}/helpful`, {
      method: 'POST',
      authIntent: 'write',
    }).then((result) => {
      trackCampusEvent('campus_feedback_helpful', { articleId, helpfulCount: result.helpfulCount });
      return result;
    });
  },

  markArticleChanged(articleId: string, note: string) {
    return request<{
      articleId: string;
      changedCount: number;
      feedback: {
        id: string;
        articleId: string;
        note: string;
        createdAt: string;
      };
    }>(`/api/campus/articles/${articleId}/changed`, {
      method: 'POST',
      authIntent: 'write',
      body: JSON.stringify({ note }),
    }).then((result) => {
      trackCampusEvent('campus_feedback_changed', { articleId, changedCount: result.changedCount });
      return result;
    });
  },

  resolveArticleChanged(articleId: string) {
    return request<{ articleId: string; resolved: boolean }>(
      `/api/campus/articles/${articleId}/resolve-changed`,
      { method: 'POST', authIntent: 'write' },
    );
  },
};

export const postsApi = {
  getSpacePosts(spaceId: string) {
    return withOfflineFallback(
      () => request<{ posts: PostRecord[] }>(`/api/campus/spaces/${spaceId}/posts`),
      offlineCampusContent.getSpacePosts,
    );
  },

  createPost(input: CreatePostInput) {
    return request<{ post: PostRecord }>('/api/campus/posts', {
      method: 'POST',
      authIntent: 'write',
      body: JSON.stringify(input),
    }).then((result) => {
      trackCampusEvent('campus_post_created', { postId: result.post.id, spaceId: input.spaceId });
      return result;
    });
  },

  replyToPost(postId: string, content: string) {
    return request<{ reply: PostReplyRecord }>(`/api/campus/posts/${postId}/replies`, {
      method: 'POST',
      authIntent: 'write',
      body: JSON.stringify({ content }),
    }).then((result) => {
      trackCampusEvent('campus_reply_created', { postId, replyId: result.reply.id });
      return result;
    });
  },

  updatePost(postId: string, input: { title?: string; content?: string }) {
    return request<{ post: PostRecord }>(`/api/campus/posts/${postId}`, {
      method: 'PATCH',
      authIntent: 'write',
      body: JSON.stringify(input),
    });
  },

  markPostSolved(postId: string) {
    return request<{ post: PostRecord }>(`/api/campus/posts/${postId}/solve`, {
      method: 'POST',
      authIntent: 'write',
    });
  },
};

export const feedApi = {
  getFeed(page: number, pageSize: number) {
    return withOfflineFallback(
      () => request<FeedResponse>(`/api/campus/feed?page=${page}&pageSize=${pageSize}`),
      () => offlineCampusContent.getFeed(page, pageSize),
    );
  },
};

export const searchApi = {
  recordSearchLog(input: { query: string; resultCount: number; usedAi: boolean }) {
    return request('/api/campus/search/logs', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  search(query: string) {
    return withOfflineFallback(
      () => request<SearchResponse>(`/api/campus/search?q=${encodeURIComponent(query)}`),
      () => offlineCampusContent.search(query),
    ).then((result) => {
      const resultCount = result.articles.length + result.posts.length + result.spaces.length;
      trackCampusEvent('campus_search', { query, resultCount, matchStatus: result.matchStatus });
      if (result.matchStatus === 'none') {
        trackCampusEvent('campus_search_no_result', { query });
      }
      return result;
    });
  },

  async searchAiStream(query: string, onDelta: (delta: string) => void) {
    let response: Response;

    try {
      response = await fetch(`${baseURL}/api/ai-gateway/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-pangen-site': FRONTLIFE_SITE,
          ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `请基于校园知识库语境回答这个问题，并提醒用户核对本地信息：${query}`,
            },
          ],
          goal: query,
          scenario: 'campus_search',
          max_tokens: 800,
        }),
      });
    } catch (err) {
      const message = getErrorMessage(err, '');
      throw new ApiError(toReadableApiMessage(message), 0);
    }

    if (!response.ok || !response.body) {
      const payload = (await response.json().catch(() => null)) as unknown;
      if (response.status === 401) {
        handleExpiredSession('read');
      }
      throw new ApiError(
        toReadableApiMessage(extractErrorMessage(payload) ?? 'AI 回答生成失败', response.status),
        response.status,
      );
    }

    const payload = (await response.json()) as {
      data?: {
        choices?: Array<{ message?: { content?: string } }>;
        mode?: 'ai' | 'demo';
        fallbackReason?: string;
      };
    };
    if (payload.data?.mode === 'demo') {
      trackCampusEvent('campus_ai_fallback', { query, fallbackReason: payload.data.fallbackReason ?? 'unknown' });
    }
    const text = payload.data?.choices?.[0]?.message?.content?.trim() || 'AI 回答暂不可用，请先查看本地搜索结果。';
    const step = 24;
    for (let index = 0; index < text.length; index += step) {
      onDelta(text.slice(index, index + step));
    }
  },
};

export const profileApi = {
  getProfile() {
    return request<ProfileResponse>('/api/campus/me/profile');
  },

  applyCertification(input: { schoolId: string; schoolName: string }) {
    return request<{ certification: { status: 'pending'; submittedAt: string } }>('/api/campus/certification/applications', {
      method: 'POST',
      authIntent: 'write',
      body: JSON.stringify(input),
    });
  },

  getCertificationStatus() {
    return request<{ certification: { status: 'none' | 'pending' | 'verified' | 'rejected'; schoolName?: string; submittedAt?: string; reviewedAt?: string; rejectReason?: string } | null }>('/api/campus/me/certification');
  },
};

export const favoritesApi = {
  favorite(input: { targetType: 'article' | 'space'; targetId: string }) {
    return request<{
      favorite: {
        id: string;
        targetType: 'article' | 'space';
        targetId: string;
        title: string;
        createdAt: string;
      };
    }>('/api/campus/favorites', {
      method: 'POST',
      authIntent: 'write',
      body: JSON.stringify(input),
    }).then((result) => {
      trackCampusEvent('campus_favorite', { targetType: input.targetType, targetId: input.targetId });
      return result;
    });
  },
};

export const moderationApi = {
  reportContent(input: { targetType: 'article' | 'post'; targetId: string; reason: string }) {
    return requestEnvelope<ModerationTaskRecord>('/api/moderation/tasks', {
      method: 'POST',
      authIntent: 'write',
      body: JSON.stringify({
        site: FRONTLIFE_SITE,
        type: 'report',
        targetType: input.targetType,
        targetId: input.targetId,
        title: input.targetType === 'article' ? '文章举报' : '帖子举报',
        reason: input.reason,
      }),
    }).then((task) => ({ task }));
  },
};

export const complianceApi = {
  listLegalDocuments(type?: 'terms' | 'privacy') {
    const query = type ? `?type=${type}` : '';
    return requestEnvelope<{ items: LegalDocumentRecord[] }>(`/api/compliance/legal-documents${query}`);
  },

  exportUserData() {
    return requestEnvelope<DataExportResponse>('/api/compliance/data-export');
  },

  requestAccountDeletion(input: { reason?: string }) {
    return requestEnvelope<AccountDeletionRequestRecord>('/api/compliance/account-deletions', {
      method: 'POST',
      authIntent: 'write',
      body: JSON.stringify(input),
    });
  },
};

export const platformApi = {
  getPermissions() {
    return requestEnvelope<CampusCapabilityResponse>('/api/platform/capabilities?site=campus')
      .then((capabilities) => ({
        canPost: capabilities.canPost,
        canWrite: capabilities.canWriteArticle,
        canCreateSpace: capabilities.canCreateSpace,
      }));
  },
};

export const notificationApi = {
  getNotifications() {
    return requestEnvelope<{ notifications: NotificationRecord[] }>('/api/notification/inbox');
  },

  markNotificationRead(id: string) {
    return requestEnvelope<{ notification: NotificationRecord }>(`/api/notification/${id}/read`, {
      method: 'POST',
      authIntent: 'write',
    });
  },
};

// 聚合导出：现有调用方无需改动，新代码使用 namespace 导入
export const api = {
  ...identityApi,
  ...spacesApi,
  ...articlesApi,
  ...postsApi,
  ...feedApi,
  ...searchApi,
  ...profileApi,
  ...favoritesApi,
  ...moderationApi,
  ...complianceApi,
  ...platformApi,
  ...notificationApi,
};

async function withOfflineFallback<T>(requester: () => Promise<T>, fallback: () => T): Promise<T> {
  try {
    return await requester();
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      throw error;
    }
    return fallback();
  }
}

function sanitizeBlockedMedia(value: unknown): unknown {
  if (typeof value === 'string') {
    return isBlockedPlaceholderImage(value) ? '/media-placeholder.svg' : value;
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeBlockedMedia);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, sanitizeBlockedMedia(entry)]),
    );
  }

  return value;
}

function isBlockedPlaceholderImage(value: string) {
  return value.includes('picsum.photos') || value.includes('fastly.picsum.photos');
}
