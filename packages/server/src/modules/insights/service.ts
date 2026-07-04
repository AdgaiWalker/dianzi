import type { AuthTokenPayload } from "../../lib/auth";
import { assertSiteReadable } from "../../db/site-aware";
import type { SiteContext } from "@dianzi/shared";
import {
  getInsightsModuleStatus as repoModuleStatus,
  listContentQualityReports,
  listSearchGapInsights,
  readAiUsageSummary,
} from "./repository";
import { isAtLeastReviewer } from "../platform/permissions";

export function getInsightsModuleStatus() {
  return repoModuleStatus();
}

export async function readSearchGapInsights(site: SiteContext, actor: AuthTokenPayload) {
  assertInsightsReader(site, actor);
  return listSearchGapInsights(site);
}

export async function readContentQualityInsights(site: SiteContext, actor: AuthTokenPayload) {
  assertInsightsReader(site, actor);
  return listContentQualityReports(site);
}

export async function readAiUsageInsights(site: SiteContext, actor: AuthTokenPayload) {
  assertInsightsReader(site, actor);
  return readAiUsageSummary(site);
}

function assertInsightsReader(site: SiteContext, actor: AuthTokenPayload) {
  assertSiteReadable(site, actor.site, actor.role);
  if (isAtLeastReviewer(actor.role!)) return;
  throw new InsightsPermissionError("没有洞察报表访问权限");
}

export class InsightsPermissionError extends Error {
  status = 403 as const;

  constructor(message: string) {
    super(message);
    this.name = "InsightsPermissionError";
  }
}
