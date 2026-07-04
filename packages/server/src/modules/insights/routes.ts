import { Hono } from "hono";
import { fail, ok } from "../../lib/http";
import { authMiddleware, requireAuthUser } from "../../middleware/auth";
import { requireSiteContext } from "../../middleware/site";
import {
  getInsightsModuleStatus,
  InsightsPermissionError,
  readAiUsageInsights,
  readContentQualityInsights,
  readSearchGapInsights,
} from "./service";

export const insightsRoute = new Hono();

insightsRoute.get("/api/insights/health", (c) => ok(c, { ok: true, ...getInsightsModuleStatus() }));

insightsRoute.get("/api/insights/search-gaps", authMiddleware, async (c) => {
  try {
    return ok(c, { items: await readSearchGapInsights(requireSiteContext(c), requireAuthUser(c)) });
  } catch (error) {
    if (error instanceof InsightsPermissionError) return fail(c, error.status, "INSIGHTS_FORBIDDEN", error.message);
    throw error;
  }
});

insightsRoute.get("/api/insights/content-quality", authMiddleware, async (c) => {
  try {
    return ok(c, { items: await readContentQualityInsights(requireSiteContext(c), requireAuthUser(c)) });
  } catch (error) {
    if (error instanceof InsightsPermissionError) return fail(c, error.status, "INSIGHTS_FORBIDDEN", error.message);
    throw error;
  }
});

insightsRoute.get("/api/insights/ai-usage", authMiddleware, async (c) => {
  try {
    return ok(c, await readAiUsageInsights(requireSiteContext(c), requireAuthUser(c)));
  } catch (error) {
    if (error instanceof InsightsPermissionError) return fail(c, error.status, "INSIGHTS_FORBIDDEN", error.message);
    throw error;
  }
});
