import { serve } from "@hono/node-server";
import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { app } from "./app";
import { cleanupAnalyticsData } from "./modules/analytics/service";
import { runAutomaticCampusSpaceClaimScan } from "./modules/campus/service";

export default app;

config();

const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url);

if (isDirectRun) {
  const port = Number(process.env.PORT ?? 4000);

  serve(
    {
      fetch: app.fetch,
      port,
    },
    (info) => {
      console.log(`frontlife-api listening on http://localhost:${info.port}`);
    },
  );

  // 注册行为数据自动清理任务（每 24 小时执行一次）
  const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000;

  setInterval(async () => {
    try {
      console.log("[Cleanup] Starting analytics data cleanup (90+ days old)...");
      const result = await cleanupAnalyticsData(90);
      console.log(`[Cleanup] Completed: deleted ${result.deleted} events older than ${result.maxAgeDays} days`);
    } catch (error) {
      console.error("[Cleanup] Failed:", error);
    }
  }, CLEANUP_INTERVAL_MS);

  setTimeout(async () => {
    try {
      console.log("[Cleanup] Initial analytics data cleanup (90+ days old)...");
      const result = await cleanupAnalyticsData(90);
      console.log(`[Cleanup] Initial cleanup completed: deleted ${result.deleted} events`);
    } catch (error) {
      console.error("[Cleanup] Initial cleanup failed:", error);
    }
  }, 5000);

  const SPACE_CLAIM_SCAN_INTERVAL_MS = 24 * 60 * 60 * 1000;
  const systemClaimActor = {
    sub: "1",
    name: "系统管理员",
    site: "cn",
    siteContext: "cn",
    role: "admin",
    iat: String(Math.floor(Date.now() / 1000)),
  } as const;

  const scanSpaceClaims = async (label: string) => {
    try {
      console.log(`[SpaceClaim] ${label} scan started...`);
      const result = await runAutomaticCampusSpaceClaimScan(systemClaimActor, 1);
      if (result.ok && result.data) {
        console.log(`[SpaceClaim] ${label} scan completed: created ${result.data.createdCount}, skipped ${result.data.skippedCount}`);
      } else {
        console.error(`[SpaceClaim] ${label} scan skipped:`, result.error);
      }
    } catch (error) {
      console.error(`[SpaceClaim] ${label} scan failed:`, error);
    }
  };

  setInterval(() => void scanSpaceClaims("scheduled"), SPACE_CLAIM_SCAN_INTERVAL_MS);
  setTimeout(() => void scanSpaceClaims("initial"), 8000);
}
