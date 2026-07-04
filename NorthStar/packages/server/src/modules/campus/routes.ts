import { Hono } from "hono";
import type { Context } from "hono";
import { and, desc, eq } from "drizzle-orm";
import {
  createArticleInDb,
  createContentExpiryNotificationInDb,
  createFavoriteInDb,
  createPostInDb,
  createReplyInDb,
  getArticleDetailFromDb,
  getProfileFromDb,
  getSpaceDetailFromDb,
  listExpiredArticlesFromDb,
  listFeedFromDb,
  listSearchGapsFromDb,
  listPostsBySpaceFromDb,
  listSpacesFromDb,
  markArticleChangedInDb,
  markArticleHelpfulInDb,
  markPostSolvedInDb,
  recordSearchLogInDb,
  resolveArticleChangedInDb,
  searchContentFromDb,
  updateArticleInDb,
  updatePostInDb,
} from "../../data/postgres";
import { db } from "../../db/client";
import { moderationTasks } from "../../db/schema";
import { getPermissionStateForUser } from "../../lib/permissions";
import { fail, ok, readJson, sendResult } from '../../lib/http';
import { authMiddleware, requireAuthUser, resolveAuthUser } from "../../middleware/auth";
import { requireSiteContext } from "../../middleware/site";
import type { AuthTokenPayload } from "../../lib/auth";
import { findSiteProfileByAccount } from "../identity/repository";
import { submitModerationTask } from "../moderation/service";
import { getCampusModuleStatus, readCampusAdminArticleDetail, scanCampusSpaceClaims, submitCampusSpace } from "./service";
import type { CreateCampusSpaceRequest, SpaceClaimScanRequest } from "./types";
import { isAtLeastReviewer, isAtLeastEditor } from '../platform/permissions';

export const campusRoute = new Hono();

campusRoute.get("/api/campus/health", (c) => ok(c, getCampusModuleStatus()));

campusRoute.get("/api/campus/admin/articles/:id", authMiddleware, async (c) => {
  const id = parseId(c.req.param("id"));
  if (!id) return fail(c, 400, "VALIDATION_ERROR", "文章 ID 不正确");

  const result = await readCampusAdminArticleDetail(requireSiteContext(c), requireAuthUser(c), id);
  return sendResult(c, result);
});

campusRoute.get("/api/campus/spaces", async (c) => {
  const spaces = await listSpacesFromDb();
  if (!spaces) return fail(c, 500, "SPACES_QUERY_FAILED", "空间列表查询失败");
  return c.json({ spaces });
});

campusRoute.get("/api/campus/spaces/:id", async (c) => {
  const detail = await getSpaceDetailFromDb(c.req.param("id"));
  if (!detail) return fail(c, 404, "SPACE_NOT_FOUND", "空间不存在");
  return c.json(detail);
});

campusRoute.post("/api/campus/spaces", authMiddleware, async (c) => {
  const result = await submitCampusSpace(
    requireSiteContext(c),
    requireAuthUser(c),
    await readJson<CreateCampusSpaceRequest>(c),
  );
  return sendResult(c, result, 201);
});

campusRoute.get("/api/campus/spaces/:id/posts", async (c) => {
  const posts = await listPostsBySpaceFromDb(c.req.param("id"));
  if (!posts) return fail(c, 404, "SPACE_NOT_FOUND", "空间不存在");
  return c.json({ posts });
});

campusRoute.get("/api/campus/articles/:id", async (c) => {
  const detail = await getArticleDetailFromDb(c.req.param("id"));
  if (!detail) return fail(c, 404, "ARTICLE_NOT_FOUND", "文章不存在");
  return c.json(detail);
});

campusRoute.post("/api/campus/articles", authMiddleware, async (c) => {
  const body = await readJson<{ spaceId?: string; title?: string; content?: string }>(c);

  if (!body.spaceId?.trim()) return fail(c, 400, "VALIDATION_ERROR", "请选择空间");
  if (!body.title?.trim()) return fail(c, 400, "VALIDATION_ERROR", "请填写标题");
  if (!body.content?.trim()) return fail(c, 400, "VALIDATION_ERROR", "请填写正文");

  const actor = requireAuthUser(c);
  const userId = await resolveCampusActorId(actor);
  if (!userId) return fail(c, 401, "INVALID_TOKEN", "登录状态已失效，请重新登录");
  const permissionState = await getPermissionStateForUser({ isAuthenticated: true, userId });

  if (!db) return fail(c, 500, "DATABASE_UNAVAILABLE", "数据库不可用");
  if (!permissionState.permissions.canWrite) return fail(c, 403, "ARTICLE_FORBIDDEN", "当前账号还不能写长文");

  const article = await createArticleInDb(userId, {
    spaceId: body.spaceId.trim(),
    title: body.title.trim(),
    content: body.content.trim(),
  });

  if (!article) return fail(c, 404, "SPACE_NOT_FOUND", "空间不存在");
  return c.json({ article }, 201);
});

campusRoute.post("/api/campus/articles/:id/helpful", authMiddleware, async (c) => {
  const actor = requireAuthUser(c);
  const userId = await resolveCampusActorId(actor);
  if (!userId) return fail(c, 401, "INVALID_TOKEN", "登录状态已失效，请重新登录");
  const result = await markArticleHelpfulInDb(c.req.param("id"), userId);
  if (!result) return fail(c, 404, "ARTICLE_NOT_FOUND", "文章不存在");
  return c.json(result);
});

campusRoute.post("/api/campus/articles/:id/changed", authMiddleware, async (c) => {
  const body = await readJson<{ note?: string }>(c);
  const note = body.note?.trim();
  if (!note) return fail(c, 400, "VALIDATION_ERROR", "请填写变化说明");

  const actor = requireAuthUser(c);
  const userId = await resolveCampusActorId(actor);
  if (!userId) return fail(c, 401, "INVALID_TOKEN", "登录状态已失效，请重新登录");
  const id = c.req.param("id");
  const result = await markArticleChangedInDb(id, note, userId);
  if (!result) return fail(c, 404, "ARTICLE_NOT_FOUND", "文章不存在");

  await submitModerationTask(
    {
      site: requireSiteContext(c) === "com" ? "com" : "cn",
      type: "changed_feedback",
      targetType: "article",
      targetId: id,
      title: "内容变化反馈",
      reason: note,
      payload: {
        articleId: id,
        changedCount: result.changedCount,
      },
    },
    actor,
  );

  return c.json(result);
});

campusRoute.post("/api/campus/articles/:id/resolve-changed", authMiddleware, async (c) => {
  const actor = requireAuthUser(c);
  const userId = await resolveCampusActorId(actor);
  if (!userId) return fail(c, 401, "INVALID_TOKEN", "登录状态已失效，请重新登录");
  const result = await resolveArticleChangedInDb(c.req.param("id"), userId);
  if (!result) return fail(c, 404, "RESOLVE_CHANGED_FAILED", "无法解除变化标记，只有文章作者可以操作");
  return c.json(result);
});

campusRoute.patch("/api/campus/articles/:id", authMiddleware, async (c) => {
  const body = await readJson<{ title?: string; content?: string; summary?: string }>(c);

  if (!body.title?.trim() && !body.content?.trim()) {
    return fail(c, 400, "VALIDATION_ERROR", "请提供标题或内容");
  }

  const actor = requireAuthUser(c);
  const userId = await resolveCampusActorId(actor);
  if (!userId) return fail(c, 401, "INVALID_TOKEN", "登录状态已失效，请重新登录");
  const updates: { title?: string; content?: string; summary?: string } = {};
  if (body.title?.trim()) updates.title = body.title.trim();
  if (body.content?.trim()) updates.content = body.content.trim();
  if (body.summary?.trim()) updates.summary = body.summary.trim();

  const article = await updateArticleInDb(c.req.param("id"), updates, userId);
  if (!article) return fail(c, 403, "ARTICLE_UPDATE_FORBIDDEN", "无权编辑此文章");
  return c.json({ article });
});

campusRoute.post("/api/campus/posts", authMiddleware, async (c) => {
  const body = await readJson<{ spaceId?: string; content?: string; tags?: string[] }>(c);

  if (!body.content?.trim()) return fail(c, 400, "VALIDATION_ERROR", "请填写帖子内容");

  const actor = requireAuthUser(c);
  const userId = await resolveCampusActorId(actor);
  if (!userId) return fail(c, 401, "INVALID_TOKEN", "登录状态已失效，请重新登录");
  const permissionState = await getPermissionStateForUser({
    isAuthenticated: true,
    userId,
  });

  if (!permissionState.permissions.canPost) return fail(c, 403, "POST_FORBIDDEN", "当前账号还不能发帖");

  const post = await createPostInDb({
    spaceId: body.spaceId,
    content: body.content.trim(),
    tags: body.tags,
    userId,
  });

  if (!post) return fail(c, 404, "SPACE_NOT_FOUND", "空间不存在");
  return c.json({ post }, 201);
});

campusRoute.post("/api/campus/posts/:id/replies", authMiddleware, async (c) => {
  const body = await readJson<{ content?: string }>(c);
  if (!body.content?.trim()) return fail(c, 400, "VALIDATION_ERROR", "请填写回复内容");

  const actor = requireAuthUser(c);
  const userId = await resolveCampusActorId(actor);
  if (!userId) return fail(c, 401, "INVALID_TOKEN", "登录状态已失效，请重新登录");
  const reply = await createReplyInDb(c.req.param("id"), body.content.trim(), userId, actor.name);

  if (!reply) return fail(c, 404, "POST_NOT_FOUND", "帖子不存在");
  return c.json({ reply }, 201);
});

campusRoute.post("/api/campus/posts/:id/solve", authMiddleware, async (c) => {
  const actor = requireAuthUser(c);
  const userId = await resolveCampusActorId(actor);
  if (!userId) return fail(c, 401, "INVALID_TOKEN", "登录状态已失效，请重新登录");
  const post = await markPostSolvedInDb(c.req.param("id"), userId);
  if (!post) return fail(c, 404, "POST_NOT_FOUND", "帖子不存在");
  return c.json({ post });
});

campusRoute.patch("/api/campus/posts/:id", authMiddleware, async (c) => {
  const body = await readJson<{ title?: string; content?: string }>(c);

  if (!body.title?.trim() && !body.content?.trim()) {
    return fail(c, 400, "VALIDATION_ERROR", "请提供标题或内容");
  }

  const actor = requireAuthUser(c);
  const userId = await resolveCampusActorId(actor);
  if (!userId) return fail(c, 401, "INVALID_TOKEN", "登录状态已失效，请重新登录");
  const updates: { title?: string; content?: string } = {};
  if (body.title?.trim()) updates.title = body.title.trim();
  if (body.content?.trim()) updates.content = body.content.trim();

  const post = await updatePostInDb(c.req.param("id"), updates, userId);
  if (!post) return fail(c, 403, "POST_UPDATE_FORBIDDEN", "无权编辑此帖子");
  return c.json({ post });
});

campusRoute.get("/api/campus/feed", async (c) => {
  const page = Number(c.req.query("page") ?? 1);
  const pageSize = Number(c.req.query("pageSize") ?? 6);
  const feed = await listFeedFromDb(page, pageSize);
  if (!feed) return fail(c, 500, "FEED_QUERY_FAILED", "动态流查询失败");
  return c.json(feed);
});

campusRoute.get("/api/campus/search", async (c) => {
  const query = c.req.query("q")?.trim();
  if (!query) return fail(c, 400, "VALIDATION_ERROR", "请输入搜索词");

  const result = await searchContentFromDb(query);
  if (!result) return fail(c, 500, "SEARCH_FAILED", "搜索失败");
  return c.json(result);
});

campusRoute.post("/api/campus/search/logs", async (c) => {
  const body = await readJson<{ query?: string; resultCount?: number; usedAi?: boolean }>(c);
  if (!body.query?.trim()) return fail(c, 400, "VALIDATION_ERROR", "请输入搜索词");

  const authUser = resolveAuthUser(c);
  const log = await recordSearchLogInDb({
    site: "cn",
    userId: authUser ? Number(authUser.sub) : null,
    query: body.query.trim(),
    resultCount: Number(body.resultCount ?? 0),
    usedAi: Boolean(body.usedAi),
  });

  if (!log) return fail(c, 500, "SEARCH_LOG_FAILED", "搜索日志写入失败");
  return c.json({ log }, 201);
});

campusRoute.get("/api/campus/search/gaps", authMiddleware, async (c) => {
  const actor = requireAuthUser(c);
  if (!isAtLeastReviewer(actor.role!)) {
    return fail(c, 403, "SEARCH_GAPS_FORBIDDEN", "没有查看搜索缺口的权限");
  }

  const gaps = await listSearchGapsFromDb();
  if (!gaps) return fail(c, 500, "SEARCH_GAPS_FAILED", "搜索缺口报表生成失败");
  return ok(c, { items: gaps });
});

campusRoute.get("/api/campus/me/profile", authMiddleware, async (c) => {
  const actor = requireAuthUser(c);
  const userId = await resolveCampusActorId(actor);
  if (!userId) return fail(c, 401, "INVALID_TOKEN", "登录状态已失效，请重新登录");
  const profile = await getProfileFromDb(userId);
  if (!profile) return fail(c, 404, "PROFILE_NOT_FOUND", "用户资料不存在");
  return c.json(profile);
});

campusRoute.get("/api/campus/me/certification", authMiddleware, async (c) => {
  const actor = requireAuthUser(c);
  if (actor.site !== "cn") return fail(c, 401, "SITE_MISMATCH", "登录状态不属于校园站");
  if (!db) return fail(c, 500, "DATABASE_UNAVAILABLE", "数据库不可用");
  const userId = await resolveCampusActorId(actor);
  if (!userId) return fail(c, 401, "INVALID_TOKEN", "登录状态已失效，请重新登录");

  const rows = await db
    .select()
    .from(moderationTasks)
    .where(
      and(
        eq(moderationTasks.site, "cn"),
        eq(moderationTasks.type, "student_certification"),
        eq(moderationTasks.targetType, "user"),
        eq(moderationTasks.targetId, String(userId)),
      ),
    )
    .orderBy(desc(moderationTasks.createdAt))
    .limit(1);

  const task = rows[0];
  if (!task) return c.json({ certification: null });

  const payload = task.payload ?? {};
  return c.json({
    certification: {
      status: toCertificationStatus(task.status),
      schoolId: typeof payload.schoolId === "string" ? payload.schoolId : undefined,
      schoolName: typeof payload.schoolName === "string" ? payload.schoolName : undefined,
      submittedAt: task.createdAt.toISOString(),
      reviewedAt: task.status === "resolved" || task.status === "dismissed" ? task.updatedAt.toISOString() : undefined,
      rejectReason: task.status === "dismissed" ? task.reason ?? undefined : undefined,
    },
  });
});

campusRoute.post("/api/campus/certification/applications", authMiddleware, async (c) => {
  const actor = requireAuthUser(c);
  if (requireSiteContext(c) !== "cn" || actor.site !== "cn") {
    return fail(c, 401, "SITE_MISMATCH", "登录状态不属于校园站");
  }
  if (!db) return fail(c, 500, "DATABASE_UNAVAILABLE", "数据库不可用");
  const userId = await resolveCampusActorId(actor);
  if (!userId) return fail(c, 401, "INVALID_TOKEN", "登录状态已失效，请重新登录");

  const body = await readJson<{ schoolId?: string; schoolName?: string }>(c);
  const schoolId = body.schoolId?.trim();
  const schoolName = body.schoolName?.trim();
  if (!schoolId || !schoolName) return fail(c, 400, "VALIDATION_ERROR", "请填写学校信息");

  const [task] = await db
    .insert(moderationTasks)
    .values({
      site: "cn",
      type: "student_certification",
      status: "pending",
      targetType: "user",
      targetId: String(userId),
      title: "学生认证申请",
      reason: schoolName,
      payload: { schoolId, schoolName },
      reporterId: userId,
    })
    .returning();

  return c.json(
    {
      certification: {
        status: "pending",
        schoolId,
        schoolName,
        submittedAt: task.createdAt.toISOString(),
      },
    },
    201,
  );
});

campusRoute.post("/api/campus/favorites", authMiddleware, async (c) => {
  const body = await readJson<{ targetType?: "article" | "space"; targetId?: string }>(c);

  if (body.targetType !== "article" && body.targetType !== "space") {
    return fail(c, 400, "VALIDATION_ERROR", "收藏类型不正确");
  }
  if (!body.targetId?.trim()) return fail(c, 400, "VALIDATION_ERROR", "收藏对象不能为空");

  const actor = requireAuthUser(c);
  const userId = await resolveCampusActorId(actor);
  if (!userId) return fail(c, 401, "INVALID_TOKEN", "登录状态已失效，请重新登录");
  const favorite = await createFavoriteInDb(userId, {
    targetType: body.targetType,
    targetId: body.targetId.trim(),
  });

  if (!favorite) return fail(c, 404, "FAVORITE_TARGET_NOT_FOUND", "收藏对象不存在");
  return c.json({ favorite }, 201);
});

campusRoute.post("/api/campus/space-claims/scan", authMiddleware, async (c) => {
  const result = await scanCampusSpaceClaims(
    requireSiteContext(c),
    requireAuthUser(c),
    await readJson<SpaceClaimScanRequest>(c),
  );
  return sendResult(c, result, 201);
});

campusRoute.post("/api/campus/content-expiry/scan", authMiddleware, async (c) => {
  const actor = requireAuthUser(c);
  if (!isAtLeastReviewer(actor.role!)) {
    return fail(c, 403, "EXPIRY_SCAN_FORBIDDEN", "没有内容过期扫描权限");
  }

  const body = await readJson<{ olderThanDays?: number }>(c);
  const olderThanDays = body.olderThanDays && Number.isInteger(body.olderThanDays) ? body.olderThanDays : 180;

  const expired = await listExpiredArticlesFromDb(olderThanDays);
  if (!expired) return fail(c, 500, "EXPIRY_SCAN_FAILED", "内容过期扫描失败");

  let notifiedCount = 0;
  for (const article of expired) {
    await createContentExpiryNotificationInDb(article.authorId, article.slug);
    notifiedCount++;
  }

  return ok(c, { scannedCount: expired.length, notifiedCount });
});

function parseId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function toCertificationStatus(status: string) {
  if (status === "resolved") return "verified";
  if (status === "dismissed") return "rejected";
  return "pending";
}

async function resolveCampusActorId(actor: AuthTokenPayload) {
  if (actor.site !== "cn") return null;

  const accountId = Number(actor.accountId);
  if (Number.isInteger(accountId)) {
    const profile = await findSiteProfileByAccount(accountId, "cn");
    return profile?.id ?? null;
  }

  const actorId = Number(actor.sub);
  return Number.isInteger(actorId) ? actorId : null;
}
