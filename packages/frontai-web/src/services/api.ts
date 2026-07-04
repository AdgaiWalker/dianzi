import type {
  Article,
  ApiEnvelope,
  ApplicationRequestInput,
  ApplicationRequestRecord,
  CompassCapabilityResponse,
  CompassContentListResponse,
  CompassContentRecord,
  CompassFavoriteRecord,
  CompassNewsRecord,
  CreateContentRequest,
  CreateContentCommentRequest,
  ContentCommentListResponse,
  ContentLikeResponse,
  CreateSolutionRequest,
  ExportFormat,
  GitHubOAuthStartResponse,
  GitHubOAuthStatusResponse,
  IdentityMeResponse,
  IdentitySession,
  InviteCodeRecord,
  LoginRequest,
  NotificationRecord,
  PasswordResetConfirmResponse,
  PasswordResetRequestResponse,
  PaymentOrderRecord,
  QuotaLedgerRecord,
  QuotaRecord,
  RegisterRequest,
  SolutionFeedbackRequest,
  SolutionRecord,
  Tool,
  Topic,
  UpdateContentRequest,
  UpdateCompassProfileRequest,
  UpdateCompassProfileResponse,
  UserCompassStats,
} from '@dianzi/shared';
import { ApiError, extractErrorMessage, createReadableMessage, getErrorMessage } from '@dianzi/shared';
import { STORAGE_KEYS, storageRemove } from '@/utils/storage';
import { trackCompassEvent } from './analyticsService';
import { offlineCompassContent } from './offlineCompassContent';

const baseURL = import.meta.env.VITE_API_BASE_URL ?? '';
const COMPASS_SITE = 'com';

const readableMessage = createReadableMessage({
  sessionExpired: '登录状态已失效，请重新登录。',
  forbidden: '当前账号暂未开放该能力。',
  serverError: '服务暂时不可用，请确认后端服务已启动或稍后重试。',
  networkError: '网络连接失败，请确认后端服务已启动或稍后重试。',
  defaultError: '请求失败，请稍后重试。',
  passthroughMessages: ['用户名、邮箱或密码不正确', '用户名或邮箱已被使用'],
});

function getStoredToken() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.identityToken);
    return raw ? (JSON.parse(raw) as string) : null;
  } catch {
    window.localStorage.removeItem(STORAGE_KEYS.identityToken);
    return null;
  }
}

async function request<T>(path: string, init?: Parameters<typeof fetch>[1]): Promise<T> {
  let response: Response;
  const token = getStoredToken();

  try {
    response = await fetch(`${baseURL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        'x-pangen-site': COMPASS_SITE,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    });
  } catch (error) {
    throw new ApiError(readableMessage(getErrorMessage(error, '')), 0);
  }

  const payload = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    if (response.status === 401) {
      storageRemove(STORAGE_KEYS.identityToken);
      storageRemove(STORAGE_KEYS.identityUser);
    }
    throw new ApiError(readableMessage(extractErrorMessage(payload) ?? '请求失败', response.status), response.status);
  }

  return sanitizeBlockedMedia(payload) as T;
}

function unwrap<T>(payload: ApiEnvelope<T>) {
  if (!payload.ok) {
    throw new ApiError(readableMessage(payload.error?.message ?? '请求失败'), 200);
  }
  return payload.data;
}

export const identityApi = {
  async login(input: Omit<LoginRequest, 'site'>) {
    return unwrap(await request<ApiEnvelope<IdentitySession>>('/api/identity/login', {
      method: 'POST',
      body: JSON.stringify({ ...input, site: COMPASS_SITE }),
    }));
  },

  async register(input: Omit<RegisterRequest, 'site'>) {
    return unwrap(await request<ApiEnvelope<IdentitySession>>('/api/identity/register', {
      method: 'POST',
      body: JSON.stringify({ ...input, site: COMPASS_SITE }),
    }));
  },

  async submitApplication(input: Omit<ApplicationRequestInput, 'site'>) {
    return unwrap(await request<ApiEnvelope<ApplicationRequestRecord>>('/api/identity/applications', {
      method: 'POST',
      body: JSON.stringify({ ...input, site: COMPASS_SITE }),
    }));
  },

  async me() {
    return unwrap(await request<ApiEnvelope<IdentityMeResponse>>('/api/identity/me'));
  },

  async updateCompassProfile(input: UpdateCompassProfileRequest) {
    return unwrap(await request<ApiEnvelope<UpdateCompassProfileResponse>>('/api/identity/compass-profile', {
      method: 'PATCH',
      body: JSON.stringify(input),
    }));
  },

  async getGitHubOAuthStatus() {
    return unwrap(await request<ApiEnvelope<GitHubOAuthStatusResponse>>('/api/identity/oauth/github/status'));
  },

  async startGitHubOAuth() {
    return unwrap(await request<ApiEnvelope<GitHubOAuthStartResponse>>('/api/identity/oauth/github/start', {
      method: 'POST',
      body: JSON.stringify({ site: COMPASS_SITE }),
    }));
  },

  async createInvite() {
    return unwrap(await request<ApiEnvelope<InviteCodeRecord>>('/api/identity/invites', {
      method: 'POST',
      body: JSON.stringify({ site: COMPASS_SITE, maxUses: 1 }),
    }));
  },
};

export const compassApi = {
  async listTools() {
    return withOfflineFallback(
      async () => unwrap(await request<ApiEnvelope<{ items: Tool[] }>>('/api/compass/tools')),
      offlineCompassContent.listTools,
    );
  },

  async getTool(id: string) {
    return withOfflineFallback(
      async () => unwrap(await request<ApiEnvelope<Tool>>(`/api/compass/tools/${encodeURIComponent(id)}`)),
      () => {
        const tool = offlineCompassContent.getTool(id);
        if (!tool) throw new ApiError('工具详情加载失败，请稍后重试。', 0);
        return tool;
      },
    );
  },

  async listTopics() {
    return withOfflineFallback(
      async () => unwrap(await request<ApiEnvelope<{ items: Topic[] }>>('/api/compass/topics')),
      offlineCompassContent.listTopics,
    );
  },

  async getTopic(id: string) {
    return withOfflineFallback(
      async () => unwrap(await request<ApiEnvelope<Topic>>(`/api/compass/topics/${encodeURIComponent(id)}`)),
      () => {
        const topic = offlineCompassContent.getTopic(id);
        if (!topic) throw new ApiError('专题详情加载失败，请稍后重试。', 0);
        return topic;
      },
    );
  },

  async listArticles() {
    return withOfflineFallback(
      async () => unwrap(await request<ApiEnvelope<{ items: Article[] }>>('/api/compass/articles')),
      offlineCompassContent.listArticles,
    );
  },

  async getArticle(id: string) {
    return withOfflineFallback(
      async () => unwrap(await request<ApiEnvelope<Article>>(`/api/compass/articles/${encodeURIComponent(id)}`)),
      () => {
        const article = offlineCompassContent.getArticle(id);
        if (!article) throw new ApiError('文章加载失败，请稍后重试。', 0);
        return article;
      },
    );
  },

  async listNews() {
    return unwrap(await request<ApiEnvelope<{ items: CompassNewsRecord[] }>>('/api/compass/news'));
  },

  async getNews(id: string) {
    return unwrap(await request<ApiEnvelope<CompassNewsRecord>>(`/api/compass/news/${encodeURIComponent(id)}`));
  },

  async getMyStats() {
    return unwrap(await request<ApiEnvelope<UserCompassStats>>('/api/compass/my-stats'));
  },

  async likeContent(id: string) {
    return unwrap(await request<ApiEnvelope<ContentLikeResponse>>(`/api/compass/content/${encodeURIComponent(id)}/like`, {
      method: 'POST',
    }));
  },

  async unlikeContent(id: string) {
    return unwrap(await request<ApiEnvelope<ContentLikeResponse>>(`/api/compass/content/${encodeURIComponent(id)}/like`, {
      method: 'DELETE',
    }));
  },

  async listComments(id: string) {
    return unwrap(await request<ApiEnvelope<ContentCommentListResponse>>(`/api/compass/content/${encodeURIComponent(id)}/comments`));
  },

  async createComment(id: string, input: CreateContentCommentRequest) {
    return unwrap(await request<ApiEnvelope<{ comment: import('@dianzi/shared').ContentCommentRecord }>>(`/api/compass/content/${encodeURIComponent(id)}/comments`, {
      method: 'POST',
      body: JSON.stringify(input),
    }));
  },

  async search(query: string) {
    trackCompassEvent('compass_search', { query });
    return withOfflineFallback(
      async () => unwrap(await request<ApiEnvelope<{
      tools: Tool[];
      topics: Topic[];
      articles: Article[];
      news: CompassNewsRecord[];
      }>>(`/api/compass/search?q=${encodeURIComponent(query)}`)),
      () => offlineCompassContent.search(query),
    );
  },

  async listFavorites() {
    return unwrap(await request<ApiEnvelope<{ items: CompassFavoriteRecord[] }>>('/api/compass/favorites'));
  },

  async addFavorite(input: Pick<CompassFavoriteRecord, 'targetType' | 'targetId'>) {
    trackCompassEvent('compass_favorite', input);
    return unwrap(await request<ApiEnvelope<CompassFavoriteRecord>>('/api/compass/favorites', {
      method: 'POST',
      body: JSON.stringify(input),
    }));
  },

  async removeFavorite(input: Pick<CompassFavoriteRecord, 'targetType' | 'targetId'>) {
    return unwrap(await request<ApiEnvelope<{ deleted: boolean }>>('/api/compass/favorites', {
      method: 'DELETE',
      body: JSON.stringify(input),
    }));
  },

  async listSolutions() {
    return unwrap(await request<ApiEnvelope<{ items: SolutionRecord[] }>>('/api/compass/solutions'));
  },

  async getSolution(id: string) {
    return unwrap(await request<ApiEnvelope<SolutionRecord>>(`/api/compass/solutions/${encodeURIComponent(id)}`));
  },

  async createSolution(input: CreateSolutionRequest) {
    trackCompassEvent('compass_solution_save', { title: input.title, toolIds: input.toolIds });
    return unwrap(await request<ApiEnvelope<SolutionRecord>>('/api/compass/solutions', {
      method: 'POST',
      body: JSON.stringify(input),
    }));
  },

  async deleteSolution(id: string) {
    return unwrap(await request<ApiEnvelope<{ deleted: boolean }>>(`/api/compass/solutions/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }));
  },

  async submitSolutionFeedback(id: string, input: SolutionFeedbackRequest) {
    trackCompassEvent('compass_solution_feedback', { solutionId: id, helpful: input.helpful });
    return unwrap(await request<ApiEnvelope<{ feedback: unknown }>>(`/api/compass/solutions/${encodeURIComponent(id)}/feedback`, {
      method: 'POST',
      body: JSON.stringify(input),
    }));
  },

  async exportSolution(id: string, format: ExportFormat) {
    trackCompassEvent('compass_solution_export', { solutionId: id, format });
    const token = getStoredToken();
    const response = await fetch(
      `${baseURL}/api/compass/solutions/${encodeURIComponent(id)}/export?format=${encodeURIComponent(format)}`,
      {
        headers: {
          'x-pangen-site': COMPASS_SITE,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
    );

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as unknown;
      throw new ApiError(readableMessage(extractErrorMessage(payload) ?? '导出失败', response.status), response.status);
    }

    return response.text();
  },
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

export const platformApi = {
  async getCompassCapabilities() {
    return unwrap(await request<ApiEnvelope<CompassCapabilityResponse>>('/api/platform/capabilities?site=compass'));
  },
};

export const billingApi = {
  async getQuota() {
    return unwrap(await request<ApiEnvelope<{ quota: QuotaRecord; ledger: QuotaLedgerRecord[] }>>('/api/billing/quota'));
  },

  async listOrders() {
    return unwrap(await request<ApiEnvelope<{ items: PaymentOrderRecord[] }>>('/api/billing/orders'));
  },

  async createManualOrder(input: { credits: number; amountCents: number; currency?: string }) {
    return unwrap(await request<ApiEnvelope<PaymentOrderRecord>>('/api/billing/orders', {
      method: 'POST',
      body: JSON.stringify(input),
    }));
  },
};

export const complianceApi = {
  async getLegalDocument(type: 'terms' | 'privacy') {
    return unwrap(await request<ApiEnvelope<{ title: string; content: string; version: string; publishedAt: string }>>(
      `/api/compliance/legal-documents?type=${type}`
    ));
  },

  async requestPasswordReset(email: string) {
    return unwrap(await request<ApiEnvelope<PasswordResetRequestResponse>>('/api/identity/password-reset/request', {
      method: 'POST',
      body: JSON.stringify({ email, site: COMPASS_SITE }),
    }));
  },

  async confirmPasswordReset(token: string, password: string) {
    return unwrap(await request<ApiEnvelope<PasswordResetConfirmResponse>>('/api/identity/password-reset/confirm', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    }));
  },

  async exportUserData() {
    return unwrap(await request<ApiEnvelope<import('@dianzi/shared').DataExportResponse>>('/api/compliance/data-export'));
  },

  async requestAccountDeletion(input: { reason?: string }) {
    return unwrap(await request<ApiEnvelope<import('@dianzi/shared').AccountDeletionRequestRecord>>('/api/compliance/account-deletions', {
      method: 'POST',
      body: JSON.stringify(input),
    }));
  },
};

export const notificationApi = {
  async getNotifications() {
    return unwrap(await request<ApiEnvelope<{ notifications: NotificationRecord[] }>>('/api/notification/inbox'));
  },

  async markRead(id: string) {
    return unwrap(await request<ApiEnvelope<{ notification: NotificationRecord }>>(`/api/notification/${encodeURIComponent(id)}/read`, {
      method: 'POST',
    }));
  },
};

export const contentApi = {
  async listContent() {
    return unwrap(await request<ApiEnvelope<CompassContentListResponse>>('/api/compass/content'));
  },

  async createContent(input: CreateContentRequest) {
    return unwrap(await request<ApiEnvelope<CompassContentRecord>>('/api/compass/content', {
      method: 'POST',
      body: JSON.stringify(input),
    }));
  },

  async getContent(id: string) {
    return unwrap(await request<ApiEnvelope<CompassContentRecord>>(`/api/compass/content/${encodeURIComponent(id)}`));
  },

  async updateContent(id: string, input: UpdateContentRequest) {
    return unwrap(await request<ApiEnvelope<CompassContentRecord>>(`/api/compass/content/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }));
  },

  async submitContentForReview(id: string) {
    return unwrap(await request<ApiEnvelope<CompassContentRecord>>(`/api/compass/content/${encodeURIComponent(id)}/submit`, {
      method: 'POST',
    }));
  },
};

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
