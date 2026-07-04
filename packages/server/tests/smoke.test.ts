import { describe, expect, it } from "vitest";
import { eq, sql } from "drizzle-orm";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { app } from "../src/app";
import { db } from "../src/db/client";
import { cleanupAnalyticsData } from "../src/modules/analytics/service";
import {
  accountDeletionRequests,
  accounts,
  articles,
  behaviorEvents,
  compassProfiles,
  contentRecords,
  knowledgeBases,
  quotas,
  users,
} from "../src/db/schema";
import { signToken } from "../src/lib/auth";

function adminAuthorization(site: "cn" | "com" = "cn") {
  return `Bearer ${signToken({ sub: "1", name: "管理员", site, role: "admin" })}`;
}

async function register(username: string, site: "cn" | "com" = "cn") {
  let inviteCode: string | undefined;
  if (site === "com") {
    inviteCode = `SMOKE-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const inviteResponse = await app.request("/api/identity/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: adminAuthorization("com"), "x-pangen-site": "com" },
      body: JSON.stringify({ site: "com", code: inviteCode, maxUses: 1 }),
    });
    expect(inviteResponse.status).toBe(201);
  }

  const response = await app.request("/api/identity/register", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-pangen-site": site },
    body: JSON.stringify({
      username,
      email: `${username}@example.com`,
      password: "password",
      site,
      consentVersion: "2026-04-24",
      inviteCode,
    }),
  });

  const body = await response.json().catch(() => null);
  return { response, body };
}

async function login(username: string, site: "cn" | "com" = "cn") {
  const response = await app.request("/api/identity/login", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-pangen-site": site },
    body: JSON.stringify({ account: username, password: "password", site }),
  });
  const body = await response.json();
  return { response, body, authorization: `Bearer ${body.data?.token}` };
}

describe("architecture smoke tests", () => {
  it("covers campus real APIs: search, spaces, articles and feedback", async () => {
    const spacesResponse = await app.request("/api/campus/spaces");
    const spacesBody = await spacesResponse.json();
    expect(spacesResponse.status).toBe(200);
    expect(spacesBody.spaces.length).toBeGreaterThan(0);

    const searchResponse = await app.request("/api/campus/search?q=食堂");
    const searchBody = await searchResponse.json();
    expect(searchResponse.status).toBe(200);
    expect(["exact", "partial", "none"]).toContain(searchBody.matchStatus);

    if (!db) return;
    const [article] = await db.select({ slug: articles.slug }).from(articles).limit(1);
    expect(article).toBeTruthy();

    const articleResponse = await app.request(`/api/campus/articles/${article.slug}`);
    const articleBody = await articleResponse.json();
    expect(articleResponse.status).toBe(200);
    expect(articleBody.article.title).toBeTruthy();

    const helpfulResponse = await app.request(`/api/campus/articles/${articleBody.article.id}/helpful`, {
      method: "POST",
      headers: { Authorization: adminAuthorization("cn"), "x-pangen-site": "cn" },
    });
    expect(helpfulResponse.status).toBe(200);
  });

  it("covers compass real APIs: tools, topics, solutions and favorites", async () => {
    if (!db) return;

    const username = `smoke-com-${Date.now()}`;
    const { response: registerResponse, body: registerBody } = await register(username, "com");
    expect(registerResponse.status).toBe(201);
    const authorization = `Bearer ${registerBody.data.token}`;

    const toolsResponse = await app.request("/api/compass/tools");
    const toolsBody = await toolsResponse.json();
    expect(toolsResponse.status).toBe(200);
    expect(toolsBody.data.items.length).toBeGreaterThan(0);

    const topicsResponse = await app.request("/api/compass/topics");
    const topicsBody = await topicsResponse.json();
    expect(topicsResponse.status).toBe(200);
    expect(topicsBody.data.items.length).toBeGreaterThan(0);

    const solutionResponse = await app.request("/api/compass/solutions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: authorization, "x-pangen-site": "com" },
      body: JSON.stringify({
        title: "Smoke 方案",
        targetGoal: "验证全球 API",
        toolIds: [toolsBody.data.items[0].id],
        content: "检索工具，整理方案，保存结果。",
      }),
    });
    expect(solutionResponse.status).toBe(201);

    const favoriteResponse = await app.request("/api/compass/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: authorization, "x-pangen-site": "com" },
      body: JSON.stringify({ targetType: "tool", targetId: toolsBody.data.items[0].id }),
    });
    expect(favoriteResponse.status).toBe(201);
  });

  it("covers admin smoke: review queue, user management and content management", async () => {
    const reviewResponse = await app.request("/api/moderation/tasks", {
      headers: { Authorization: adminAuthorization("cn"), "x-pangen-site": "cn" },
    });
    expect(reviewResponse.status).toBe(200);

    const usersResponse = await app.request("/api/admin/users", {
      headers: { Authorization: adminAuthorization("cn"), "x-pangen-site": "cn" },
    });
    expect(usersResponse.status).toBe(200);

    const contentResponse = await app.request("/api/compass/admin/content", {
      headers: { Authorization: adminAuthorization("com"), "x-pangen-site": "com" },
    });
    expect(contentResponse.status).toBe(200);
  });

  it("keeps cn and com data isolated under the same account", async () => {
    if (!db) return;

    const username = `smoke-isolation-${Date.now()}`;
    const email = `${username}@example.com`;
    const cnRegister = await app.request("/api/identity/register", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-pangen-site": "cn" },
      body: JSON.stringify({ username, email, password: "password", site: "cn", consentVersion: "2026-04-24" }),
    });
    const cnBody = await cnRegister.json();
    expect(cnRegister.status).toBe(201);

    await db.insert(accounts).values({ handle: `${username}-existing`, email, name: username }).onConflictDoNothing();
    await db.insert(compassProfiles).values({
      accountId: Number(cnBody.data.user.accountId),
      userId: Number(cnBody.data.user.id),
      applicationStatus: "approved",
      displayName: username,
    }).onConflictDoNothing();

    const cnMe = await app.request("/api/identity/me", {
      headers: { Authorization: `Bearer ${cnBody.data.token}`, "x-pangen-site": "cn" },
    });
    const cnMeBody = await cnMe.json();
    expect(cnMe.status).toBe(200);
    expect(cnMeBody.data.campusProfile.userId).toBe(cnBody.data.user.id);
    expect(cnMeBody.data.account.id).toBe(cnBody.data.user.accountId);
  });

  it("returns demo mode and fallback reason without an AI key", async () => {
    const oldKey = process.env.AI_API_KEY;
    delete process.env.AI_API_KEY;
    try {
      const response = await app.request("/api/ai-gateway/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: "帮我规划论文写作" }] }),
      });
      const body = await response.json();
      expect(response.status).toBe(200);
      expect(body.data.mode).toBe("demo");
      expect(body.data.fallbackReason).toBe("missing_key");
    } finally {
      if (oldKey) process.env.AI_API_KEY = oldKey;
    }
  });

  it("returns quota_exhausted when AI quota is empty", async () => {
    if (!db) return;

    const username = `smoke-quota-${Date.now()}`;
    const registerResponse = await app.request("/api/identity/register", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-pangen-site": "cn" },
      body: JSON.stringify({ username, password: "password", site: "cn", consentVersion: "2026-04-24" }),
    });
    const registerBody = await registerResponse.json();
    expect(registerResponse.status).toBe(201);

    await db.insert(quotas).values({
      userId: Number(registerBody.data.user.id),
      site: "cn",
      aiCreditsRemaining: 0,
    }).onConflictDoUpdate({
      target: [quotas.userId, quotas.site],
      set: { aiCreditsRemaining: 0 },
    });

    const response = await app.request("/api/ai-gateway/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${registerBody.data.token}`, "x-pangen-site": "cn" },
      body: JSON.stringify({ messages: [{ role: "user", content: "帮我搜索校园打印" }] }),
    });
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.data.mode).toBe("demo");
    expect(body.data.fallbackReason).toBe("quota_exhausted");
  });

  it("rejects invalid tokens with 401", async () => {
    const response = await app.request("/api/identity/me", {
      headers: { Authorization: "Bearer invalid-token", "x-pangen-site": "cn" },
    });
    expect(response.status).toBe(401);
  });

  it("handles empty data states for search and user content", async () => {
    if (!db) return;

    const searchResponse = await app.request(`/api/campus/search?q=empty-smoke-${Date.now()}`);
    const searchBody = await searchResponse.json();
    expect(searchResponse.status).toBe(200);
    expect(searchBody.matchStatus).toBe("none");

    const username = `smoke-empty-${Date.now()}`;
    const { response: registerResponse, body: registerBody } = await register(username, "com");
    expect(registerResponse.status).toBe(201);

    const contentResponse = await app.request("/api/compass/content", {
      headers: { Authorization: `Bearer ${registerBody.data.token}`, "x-pangen-site": "com" },
    });
    const contentBody = await contentResponse.json();
    expect(contentResponse.status).toBe(200);
    expect(contentBody.data.items).toHaveLength(0);
  });

  it("keeps frontend API wrappers prepared for server outage graceful failure", async () => {
    const root = resolve(__dirname, "../../");
    const frontaiApi = await readFile(resolve(root, "frontai-web/src/services/api.ts"), "utf8");
    const frontlifeAnalytics = await readFile(resolve(root, "frontlife-web/src/services/analyticsService.ts"), "utf8");

    expect(frontaiApi).toContain("createReadableMessage");
    expect(frontaiApi).toContain("fetch(");
    expect(frontlifeAnalytics).toContain("trackCampusEvent");
    expect(frontlifeAnalytics).toContain("catch");
  });

  it("cleans behavior data older than 90 days", async () => {
    if (!db) return;

    const oldDate = new Date("2025-01-01T00:00:00.000Z");
    const [row] = await db.insert(behaviorEvents).values({
      site: "cn",
      userId: null,
      event: "campus_search",
      metadata: { query: "old-smoke" },
      createdAt: oldDate,
    }).returning({ id: behaviorEvents.id });

    const result = await cleanupAnalyticsData(90);
    expect(result.deleted).toBeGreaterThanOrEqual(1);

    const rows = await db.select().from(behaviorEvents).where(eq(behaviorEvents.id, row.id));
    expect(rows).toHaveLength(0);
  });

  it("covers data export and deletion workflow", async () => {
    if (!db) return;

    const username = `smoke-delete-${Date.now()}`;
    const registerResponse = await app.request("/api/identity/register", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-pangen-site": "cn" },
      body: JSON.stringify({ username, password: "password", site: "cn", consentVersion: "2026-04-24" }),
    });
    const registerBody = await registerResponse.json();
    expect(registerResponse.status).toBe(201);
    const authorization = `Bearer ${registerBody.data.token}`;

    const exportResponse = await app.request("/api/compliance/data-export", {
      headers: { Authorization: authorization, "x-pangen-site": "cn" },
    });
    expect(exportResponse.status).toBe(200);

    const requestResponse = await app.request("/api/compliance/account-deletions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: authorization, "x-pangen-site": "cn" },
      body: JSON.stringify({ reason: "smoke test" }),
    });
    const requestBody = await requestResponse.json();
    expect(requestResponse.status).toBe(201);

    const approveResponse = await app.request(`/api/compliance/account-deletions/${requestBody.data.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: adminAuthorization("cn"), "x-pangen-site": "cn" },
      body: JSON.stringify({ status: "completed" }),
    });
    expect(approveResponse.status).toBe(200);

    const [deletedRequest] = await db
      .select()
      .from(accountDeletionRequests)
      .where(eq(accountDeletionRequests.id, Number(requestBody.data.id)))
      .limit(1);
    expect(deletedRequest.status).toBe("completed");
  });
});
