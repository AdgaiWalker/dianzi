import { Hono } from "hono";
import { cors } from "hono/cors";
import { aiGatewayRoute } from "./modules/ai-gateway/routes";
import { analyticsRoute } from "./modules/analytics/routes";
import { billingRoute } from "./modules/billing/routes";
import { campusRoute } from "./modules/campus/routes";
import { compassRoute } from "./modules/compass/routes";
import { complianceRoute } from "./modules/compliance/routes";
import { identityRoute } from "./modules/identity/routes";
import { insightsRoute } from "./modules/insights/routes";
import { moderationRoute } from "./modules/moderation/routes";
import { notificationRoute } from "./modules/notification/routes";
import { platformRoute } from "./modules/platform/routes";
import { ideasRoute } from "./modules/ideas/routes";
import { siteMiddleware } from "./middleware/site";
import { chinaAccessMediaMiddleware } from "./middleware/china-access";
import { HttpBadRequest } from "./lib/http";
import { cleanupAnalyticsData } from "./modules/analytics/service";
import { runAutomaticCampusSpaceClaimScan } from "./modules/campus/service";

// 初始化邮件 provider（检查 SMTP 配置）
import { initEmailProvider } from "./modules/notification/email-provider";
initEmailProvider();

export const app = new Hono();
export default app;

app.use(
  "/api/*",
  cors({
    origin: (origin) => origin || "*",
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  }),
);

app.use("/api/*", siteMiddleware);
app.use("/api/*", chinaAccessMediaMiddleware);

app.onError((err, c) => {
  if (err instanceof HttpBadRequest) {
    return c.json({ ok: false, error: { code: 'BAD_REQUEST', message: err.message } }, 400);
  }
  console.error('Unhandled error:', err);
  return c.json({ ok: false, error: { code: 'INTERNAL_ERROR', message: '服务暂时不可用' } }, 500);
});

app.get("/api/health", (c) => {
  return c.json({
    status: "ok",
    service: "frontlife-api",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/cron/daily", async (c) => {
  const auth = c.req.header("Authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const results: Record<string, unknown> = {};

  try {
    const cleanupResult = await cleanupAnalyticsData(90);
    results.analyticsCleanup = { deleted: cleanupResult.deleted, maxAgeDays: cleanupResult.maxAgeDays };
  } catch (err) {
    results.analyticsCleanup = { error: String(err) };
  }

  try {
    const systemClaimActor = {
      sub: "1",
      name: "系统管理员",
      site: "cn",
      siteContext: "cn",
      role: "admin",
      iat: String(Math.floor(Date.now() / 1000)),
    } as const;
    const claimResult = await runAutomaticCampusSpaceClaimScan(systemClaimActor, 1);
    if (claimResult.ok && claimResult.data) {
      results.spaceClaim = { createdCount: claimResult.data.createdCount, skippedCount: claimResult.data.skippedCount };
    } else {
      results.spaceClaim = { error: claimResult.error };
    }
  } catch (err) {
    results.spaceClaim = { error: String(err) };
  }

  return c.json({ ok: true, results, timestamp: new Date().toISOString() });
});

app.route("/", platformRoute);
app.route("/", moderationRoute);
app.route("/", identityRoute);
app.route("/", campusRoute);
app.route("/", compassRoute);
app.route("/", aiGatewayRoute);
app.route("/", insightsRoute);
app.route("/", notificationRoute);
app.route("/", analyticsRoute);
app.route("/", billingRoute);
app.route("/", complianceRoute);
app.route("/", ideasRoute);

