import type { AiUsageSummary, ContentQualityReport, SearchGapInsight, SiteContext } from "@dianzi/shared";
import { and, count, desc, eq, sql } from "drizzle-orm";
import { db } from "../../db/client";
import { ensureSearchLogsSiteColumn } from "../../db/schema-guards";
import { aiCallLogs, contentRecords, searchLogs } from "../../db/schema";
import type { InsightsModuleStatus } from "./types";

export function getInsightsModuleStatus(): InsightsModuleStatus {
  return { module: "insights", ready: true };
}

export async function listSearchGapInsights(site: SiteContext): Promise<SearchGapInsight[]> {
  if (!db) return [];
  await ensureSearchLogsSiteColumn();

  const whereSite = site === "all" ? sql`true` : eq(searchLogs.site, site);
  const rows = await db
    .select({
      query: searchLogs.query,
      count: sql<number>`count(*)::int`,
      lastSearchedAt: sql<Date>`max(${searchLogs.createdAt})`,
    })
    .from(searchLogs)
    .where(and(whereSite, eq(searchLogs.resultCount, 0)))
    .groupBy(searchLogs.query)
    .orderBy(sql`count(*) desc`, sql`max(${searchLogs.createdAt}) desc`)
    .limit(50);

  return rows.map((row) => ({
    query: row.query,
    count: Number(row.count),
    lastSearchedAt: toIso(row.lastSearchedAt),
  }));
}

export async function listContentQualityReports(site: SiteContext): Promise<ContentQualityReport[]> {
  if (!db) return [];

  const concreteSite = site === "all" ? undefined : site;
  const rows = await db
    .select({
      contentType: contentRecords.contentType,
      status: contentRecords.status,
      count: count(),
      updatedWithin30Days: sql<number>`sum(case when ${contentRecords.updatedAt} >= now() - interval '30 days' then 1 else 0 end)::int`,
      averageViews: sql<number>`avg(coalesce((${contentRecords.metadata}->>'views')::int, 0))`,
      averageLikes: sql<number>`avg(coalesce((${contentRecords.metadata}->>'likes')::int, 0))`,
      averageComments: sql<number>`avg(coalesce((${contentRecords.metadata}->>'comments')::int, 0))`,
    })
    .from(contentRecords)
    .where(concreteSite ? eq(contentRecords.site, concreteSite) : undefined)
    .groupBy(contentRecords.contentType, contentRecords.status)
    .orderBy(contentRecords.contentType, contentRecords.status);

  const byType = new Map<string, ContentQualityReport>();
  for (const row of rows) {
    const current =
      byType.get(row.contentType) ??
      {
        contentType: row.contentType,
        publishedCount: 0,
        draftCount: 0,
        pendingCount: 0,
        rejectedCount: 0,
        updatedWithin30Days: 0,
        averageViews: 0,
        averageLikes: 0,
        averageComments: 0,
      };
    const value = Number(row.count);
    if (row.status === "published") current.publishedCount += value;
    if (row.status === "draft") current.draftCount += value;
    if (row.status === "pending") current.pendingCount += value;
    if (row.status === "rejected") current.rejectedCount += value;
    current.updatedWithin30Days += Number(row.updatedWithin30Days ?? 0);
    current.averageViews = Math.round(Number(row.averageViews ?? 0));
    current.averageLikes = Math.round(Number(row.averageLikes ?? 0));
    current.averageComments = Math.round(Number(row.averageComments ?? 0));
    byType.set(row.contentType, current);
  }

  return [...byType.values()];
}

export async function readAiUsageSummary(site: SiteContext): Promise<AiUsageSummary> {
  if (!db) return emptyAiUsageSummary(site);

  const whereSite = site === "all" ? undefined : eq(aiCallLogs.site, site);
  const [totals] = await db
    .select({
      totalCalls: count(),
      aiCalls: sql<number>`sum(case when ${aiCallLogs.mode} = 'ai' then 1 else 0 end)::int`,
      fallbackCalls: sql<number>`sum(case when ${aiCallLogs.mode} = 'demo' then 1 else 0 end)::int`,
      totalPromptTokens: sql<number>`sum(${aiCallLogs.promptTokens})::int`,
      totalCompletionTokens: sql<number>`sum(${aiCallLogs.completionTokens})::int`,
      totalCostCents: sql<number>`sum(${aiCallLogs.costCents})::int`,
    })
    .from(aiCallLogs)
    .where(whereSite);

  const reasonRows = await db
    .select({
      reason: aiCallLogs.fallbackReason,
      count: count(),
    })
    .from(aiCallLogs)
    .where(whereSite ? and(whereSite, eq(aiCallLogs.mode, "demo")) : eq(aiCallLogs.mode, "demo"))
    .groupBy(aiCallLogs.fallbackReason)
    .orderBy(desc(count()))
    .limit(10);

  const hourRows = await db
    .select({
      hour: sql<number>`extract(hour from ${aiCallLogs.createdAt})::int`,
      count: count(),
    })
    .from(aiCallLogs)
    .where(whereSite)
    .groupBy(sql`extract(hour from ${aiCallLogs.createdAt})::int`)
    .orderBy(desc(count()))
    .limit(1);

  const totalCalls = Number(totals?.totalCalls ?? 0);
  const fallbackCalls = Number(totals?.fallbackCalls ?? 0);

  return {
    site,
    totalCalls,
    aiCalls: Number(totals?.aiCalls ?? 0),
    fallbackCalls,
    fallbackRate: totalCalls > 0 ? fallbackCalls / totalCalls : 0,
    totalPromptTokens: Number(totals?.totalPromptTokens ?? 0),
    totalCompletionTokens: Number(totals?.totalCompletionTokens ?? 0),
    totalCostCents: Number(totals?.totalCostCents ?? 0),
    peakHour: hourRows[0] ? Number(hourRows[0].hour) : null,
    fallbackReasons: reasonRows.map((row) => ({ reason: row.reason || "unknown", count: Number(row.count) })),
  };
}

function emptyAiUsageSummary(site: SiteContext): AiUsageSummary {
  return {
    site,
    totalCalls: 0,
    aiCalls: 0,
    fallbackCalls: 0,
    fallbackRate: 0,
    totalPromptTokens: 0,
    totalCompletionTokens: 0,
    totalCostCents: 0,
    peakHour: null,
    fallbackReasons: [],
  };
}

function toIso(value: Date | string) {
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}
