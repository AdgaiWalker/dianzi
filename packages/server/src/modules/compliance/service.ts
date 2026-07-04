import type { AuthTokenPayload } from "../../lib/auth";
import { assertSiteReadable } from "../../db/site-aware";
import { db } from "../../db/client";
import {
  articles,
  behaviorEvents,
  compassFavorites,
  favorites,
  feedbacks,
  posts,
  solutionExports,
  solutionFeedbacks,
  solutions,
  users,
} from "../../db/schema";
import { eq } from "drizzle-orm";
import {
  findAccountById,
  findSiteProfileByAccount,
  findUserById,
  invalidateAccountTokens,
  invalidateUserTokens,
  readAccountProfiles,
  toAccountRecord,
} from "../identity/repository";
import { writeAuditLog } from "../platform/service";
import {
  createAccountDeletionRequest,
  createLegalDocument,
  createUserConsent,
  exportUserData,
  listAccountDeletionRequests,
  listLegalDocuments,
  getComplianceModuleStatus as getModuleStatusFromRepo,
  updateAccountDeletionRequestStatus,
  updateLegalDocumentStatus,
} from "./repository";
import { isAtLeastReviewer } from '../platform/permissions';
import type {
  AccountDeletionRequestInput,
  AccountDeletionStatus,
  ConsentRequest,
  CreateLegalDocumentRequest,
  LegalDocumentStatus,
  SiteContext,
} from "./types";

export function getComplianceModuleStatus() {
  return getModuleStatusFromRepo();
}

export function readLegalDocuments(site: SiteContext, type?: string) {
  return listLegalDocuments(site, type);
}

export async function recordConsent(actor: AuthTokenPayload, input: ConsentRequest) {
  const userId = toNumberOrNull(actor.sub);
  if (!userId) return resultError("INVALID_TOKEN", "登录状态已失效，请重新登录", 401);
  assertSiteReadable(input.site, actor.site, actor.role);
  if (!input.version?.trim()) return resultError("VALIDATION_ERROR", "请提供协议版本", 400);

  return resultOk({ items: await createUserConsent(userId, input.site, input.version.trim()) });
}

export async function readUserDataExport(actor: AuthTokenPayload) {
  const site = actor.site === "com" ? "com" : "cn";
  const userId = await resolveCurrentProfileId(actor, site);
  if (!userId) return resultError("INVALID_TOKEN", "登录状态已失效，请重新登录", 401);

  const data = await exportUserData(userId, site);
  if (!data) return resultError("USER_NOT_FOUND", "用户不存在", 404);

  const accountId = toNumberOrNull(actor.accountId ?? "");
  if (!accountId) return resultOk(data);

  const [account, profiles] = await Promise.all([findAccountById(accountId), readAccountProfiles(accountId)]);
  if (!account) return resultOk(data);

  return resultOk({
    ...data,
    payload: {
      ...data.payload,
      account: toAccountRecord(account),
      currentProfile: site === "cn" ? profiles.campusProfile : profiles.compassProfile,
    },
  });
}

export async function readAdminUserDataExport(site: SiteContext, actor: AuthTokenPayload, userId: number) {
  assertSiteReadable(site, actor.site, actor.role);
  assertComplianceOperator(actor);
  if (site === "all") return resultError("VALIDATION_ERROR", "请选择具体站点后导出用户数据", 400);

  const data = await exportUserData(userId, site);
  if (!data) return resultError("USER_NOT_FOUND", "用户不存在", 404);

  await writeAuditLog({
    actorId: toNumberOrNull(actor.sub),
    site,
    targetType: "user",
    targetId: String(userId),
    action: "compliance.data_exported",
    before: null,
    after: { userId: String(userId), site, exportedAt: data.exportedAt },
  });

  return resultOk(data);
}

export async function createAdminLegalDocument(
  site: SiteContext,
  actor: AuthTokenPayload,
  input: CreateLegalDocumentRequest,
) {
  assertSiteReadable(site, actor.site, actor.role);
  assertComplianceOperator(actor);

  if (site !== "all" && input.site !== site) return resultError("SITE_FORBIDDEN", "只能管理当前站点的法律文档", 403);
  if (input.site !== "cn" && input.site !== "com") return resultError("VALIDATION_ERROR", "法律文档站点不正确", 400);
  if (input.type !== "terms" && input.type !== "privacy") return resultError("VALIDATION_ERROR", "法律文档类型不正确", 400);
  if (!input.version?.trim()) return resultError("VALIDATION_ERROR", "请填写版本号", 400);
  if (!input.title?.trim()) return resultError("VALIDATION_ERROR", "请填写标题", 400);
  if (!input.content?.trim()) return resultError("VALIDATION_ERROR", "请填写正文", 400);
  if (input.status && !isLegalDocumentStatus(input.status)) return resultError("VALIDATION_ERROR", "法律文档状态不正确", 400);

  const document = await createLegalDocument(input);
  if (!document) return resultError("DATABASE_UNAVAILABLE", "数据库不可用，无法创建法律文档", 503);

  await writeAuditLog({
    actorId: toNumberOrNull(actor.sub),
    site: input.site,
    targetType: "legal_document",
    targetId: document.id,
    action: "compliance.legal_document_created",
    before: null,
    after: { ...document },
  });

  return resultOk(document);
}

export async function updateAdminLegalDocumentStatus(
  site: SiteContext,
  actor: AuthTokenPayload,
  id: number,
  status: LegalDocumentStatus,
) {
  assertSiteReadable(site, actor.site, actor.role);
  assertComplianceOperator(actor);
  if (!isLegalDocumentStatus(status)) return resultError("VALIDATION_ERROR", "法律文档状态不正确", 400);

  const result = await updateLegalDocumentStatus(site, id, status);
  if (!result) return resultError("DOCUMENT_NOT_FOUND", "法律文档不存在", 404);

  await writeAuditLog({
    actorId: toNumberOrNull(actor.sub),
    site,
    targetType: "legal_document",
    targetId: String(id),
    action: "compliance.legal_document_status_updated",
    before: { ...result.before },
    after: { ...result.after },
  });

  return resultOk(result.after);
}

export async function submitDeletionRequest(actor: AuthTokenPayload, input: AccountDeletionRequestInput) {
  const site = actor.site === "com" ? "com" : "cn";
  const userId = await resolveCurrentProfileId(actor, site);
  if (!userId) return resultError("INVALID_TOKEN", "登录状态已失效，请重新登录", 401);

  const request = await createAccountDeletionRequest(userId, site, input.reason);
  if (!request) return resultError("DATABASE_UNAVAILABLE", "数据库未连接，无法提交注销申请", 503);

  return resultOk(request);
}

async function resolveCurrentProfileId(actor: AuthTokenPayload, site: "cn" | "com") {
  const accountId = toNumberOrNull(actor.accountId ?? "");
  if (accountId) {
    const profile = await findSiteProfileByAccount(accountId, site);
    return profile?.id ?? null;
  }

  return toNumberOrNull(actor.sub);
}

export async function readDeletionRequests(site: SiteContext, actor: AuthTokenPayload) {
  assertSiteReadable(site, actor.site, actor.role);
  assertComplianceOperator(actor);
  return resultOk({ items: await listAccountDeletionRequests(site) });
}

export async function updateDeletionRequestStatus(
  site: SiteContext,
  actor: AuthTokenPayload,
  id: number,
  status: AccountDeletionStatus,
) {
  assertSiteReadable(site, actor.site, actor.role);
  assertComplianceOperator(actor);

  const actorId = toNumberOrNull(actor.sub);
  const result = await updateAccountDeletionRequestStatus(site, id, status, actorId);
  if (!result) return resultError("REQUEST_NOT_FOUND", "注销申请不存在", 404);

  if (status === "completed") {
    const deletedUser = await findUserById(Number(result.after.userId));
    if (deletedUser?.accountId) {
      await invalidateAccountTokens(deletedUser.accountId);
    } else {
      await invalidateUserTokens(Number(result.after.userId));
    }

    // 异步数据清除：删除用户关联数据，匿名化用户记录
    if (db) {
      const userId = Number(result.after.userId);

      await db.delete(posts).where(eq(posts.authorId, userId));
      await db.delete(articles).where(eq(articles.authorId, userId));
      await db.delete(feedbacks).where(eq(feedbacks.userId, userId));
      await db.delete(favorites).where(eq(favorites.userId, userId));
      await db.delete(solutionFeedbacks).where(eq(solutionFeedbacks.userId, userId));
      await db.delete(solutionExports).where(eq(solutionExports.userId, userId));
      await db.delete(solutions).where(eq(solutions.userId, userId));
      await db.delete(behaviorEvents).where(eq(behaviorEvents.userId, userId));
      await db.delete(compassFavorites).where(eq(compassFavorites.userId, userId));

      // 匿名化用户记录（保留 id，清除个人信息）
      await db
        .update(users)
        .set({
          email: null,
          username: `deleted_${userId}`,
          phone: null,
          wxOpenId: null,
          githubId: null,
          nickname: "已注销用户",
          avatar: null,
          passwordHash: null,
          disabledAt: new Date(),
        })
        .where(eq(users.id, userId));
    }
  }

  await writeAuditLog({
    actorId,
    site,
    targetType: "account_deletion_request",
    targetId: String(id),
    action: "compliance.deletion_status_changed",
    before: { ...result.before },
    after: { ...result.after },
  });

  return resultOk(result.after);
}

function assertComplianceOperator(actor: AuthTokenPayload) {
  if (isAtLeastReviewer(actor.role!)) return;
  throw new CompliancePermissionError("没有合规后台权限");
}

function isLegalDocumentStatus(value: unknown): value is LegalDocumentStatus {
  return value === "published" || value === "archived";
}

function toNumberOrNull(value: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

export class CompliancePermissionError extends Error {
  status = 403 as const;

  constructor(message: string) {
    super(message);
    this.name = "CompliancePermissionError";
  }
}

interface Result<T> {
  ok: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    status: 400 | 401 | 403 | 404 | 503;
  };
}

function resultOk<T>(data: T): Result<T> {
  return { ok: true, data };
}

function resultError(
  code: string,
  message: string,
  status: 400 | 401 | 403 | 404 | 503,
): Result<never> {
  return { ok: false, error: { code, message, status } };
}
