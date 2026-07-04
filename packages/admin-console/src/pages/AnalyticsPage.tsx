import { useCallback, useMemo, useState } from "react";
import type { AnalyticsMetric, BehaviorEventRecord } from "@dianzi/shared";
import { DataState } from "../components/DataState";
import { PageShell } from "../components/PageShell";
import { Pagination } from "../components/Pagination";
import { useApiResource } from "../components/useApiResource";
import type { AiCallLog, SearchGap } from "../services/api";
import {
  getAnalyticsEvents,
  getAnalyticsMetrics,
  getAiCallLogs,
  getSearchGaps,
  getContentQualityReport,
} from "../services/api";
import type { PageProps } from "../types";

export function AnalyticsPage({ site, token }: PageProps) {
  const [activeTab, setActiveTab] = useState<"metrics" | "events" | "insights" | "ai-cost" | "quality">("metrics");
  const [eventPage, setEventPage] = useState(1);
  const eventPageSize = 20;
  const load = useCallback(
    async () => {
      const [metrics, events] = await Promise.all([getAnalyticsMetrics(site, token), getAnalyticsEvents(site, token)]);
      return { metrics: metrics.items, events: events.items };
    },
    [site, token],
  );
  const resource = useApiResource(load);
  const metrics = resource.data?.metrics ?? [];
  const events = resource.data?.events ?? [];

  const totalPages = Math.max(1, Math.ceil(events.length / eventPageSize));
  const currentPage = Math.min(eventPage, totalPages);
  const pagedEvents = events.slice((currentPage - 1) * eventPageSize, currentPage * eventPageSize);

  return (
    <PageShell title="数据中心">
      <div className="mb-4 flex gap-2 border-b border-line">
        <button className={`tab-button ${activeTab === "metrics" ? "active" : ""}`} type="button" onClick={() => setActiveTab("metrics")}>
          指标
        </button>
        <button className={`tab-button ${activeTab === "events" ? "active" : ""}`} type="button" onClick={() => setActiveTab("events")}>
          事件
        </button>
        <button className={`tab-button ${activeTab === "insights" ? "active" : ""}`} type="button" onClick={() => setActiveTab("insights")}>
          洞察
        </button>
        <button className={`tab-button ${activeTab === "ai-cost" ? "active" : ""}`} type="button" onClick={() => setActiveTab("ai-cost")}>
          AI 成本
        </button>
        <button className={`tab-button ${activeTab === "quality" ? "active" : ""}`} type="button" onClick={() => setActiveTab("quality")}>
          质量报告
        </button>
      </div>

      <DataState loading={resource.loading} error={resource.error} empty={!resource.data} emptyText="暂无数据指标" onRetry={resource.refresh}>
        {activeTab === "metrics" && (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {metrics.length === 0 ? (
              <div className="metric-card">
                <div className="text-sm text-neutral-500">行为事件</div>
                <div className="mt-2 text-xl font-semibold">暂无聚合指标</div>
              </div>
            ) : (
              metrics.map((metric) => <AnalyticsMetricCard key={metric.key} metric={metric} />)
            )}
          </div>
        )}

        {activeTab === "events" && (
          <div className="detail-panel">
            <h2 className="mb-3 font-semibold">最近行为事件</h2>
            {events.length === 0 ? (
              <div className="text-sm text-neutral-500">暂无行为事件</div>
            ) : (
              <>
                <div className="table-list">
                  {pagedEvents.map((event) => (
                    <div className="table-row" key={event.id}>
                      <div>
                        <div className="font-medium">{event.event}</div>
                        <div className="text-sm text-neutral-500">
                          {event.site} · 用户 {event.userId ?? "匿名"} · {formatMetadata(event.metadata)}
                        </div>
                      </div>
                      <span className="text-sm text-neutral-500">{new Date(event.createdAt).toLocaleString("zh-CN")}</span>
                    </div>
                  ))}
                </div>
                <Pagination page={currentPage} total={events.length} pageSize={eventPageSize} onChange={setEventPage} />
              </>
            )}
          </div>
        )}

        {activeTab === "insights" && <InsightsTab site={site} token={token} />}
        {activeTab === "ai-cost" && <AiCostTab site={site} token={token} />}
        {activeTab === "quality" && <QualityReportTab site={site} token={token} />}
      </DataState>
    </PageShell>
  );
}

function InsightsTab({ site, token }: PageProps) {
  const load = useCallback(() => getSearchGaps(site, token), [site, token]);
  const resource = useApiResource(load);
  const gaps: SearchGap[] = resource.data?.items ?? [];

  return (
    <div className="detail-panel">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-semibold">搜索缺口排名</h2>
        <span className="text-sm text-neutral-500">{gaps.length} 条记录</span>
      </div>
      <DataState loading={resource.loading} error={resource.error} empty={gaps.length === 0} emptyText="暂无搜索缺口数据" onRetry={resource.refresh}>
        <div className="table-list">
          {gaps.map((gap, index) => (
            <div className="table-row" key={gap.query}>
              <div>
                <div className="font-medium">
                  <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-neutral-100 text-xs font-medium text-neutral-600">
                    {index + 1}
                  </span>
                  {gap.query}
                </div>
                <div className="text-sm text-neutral-500">未命中 {gap.missedCount} 次</div>
              </div>
              <span className="text-sm text-neutral-500">{new Date(gap.lastMissedAt).toLocaleString("zh-CN")}</span>
            </div>
          ))}
        </div>
      </DataState>
    </div>
  );
}

function AiCostTab({ site, token }: PageProps) {
  const load = useCallback(() => getAiCallLogs(site, token), [site, token]);
  const resource = useApiResource(load);
  const rawLogs = resource.data?.items;
  const stats = useMemo(() => {
    const logs: AiCallLog[] = rawLogs ?? [];
    const bySite = { cn: 0, com: 0 };
    const byMode = { ai: 0, demo: 0 };
    const byFallback: Record<string, number> = {};
    let totalLatency = 0;

    logs.forEach((log) => {
      bySite[log.site as keyof typeof bySite]++;
      byMode[log.mode]++;
      if (log.fallbackReason) {
        byFallback[log.fallbackReason] = (byFallback[log.fallbackReason] || 0) + 1;
      }
      totalLatency += log.latency;
    });

    return { bySite, byMode, byFallback, avgLatency: logs.length ? totalLatency / logs.length : 0 };
  }, [rawLogs]);

  const logs: AiCallLog[] = rawLogs ?? [];

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <div className="grid gap-3">
        <div className="metric-card">
          <div className="text-sm text-neutral-500">总调用次数</div>
          <div className="mt-2 text-3xl font-semibold">{logs.length}</div>
        </div>
        <div className="metric-card">
          <div className="text-sm text-neutral-500">校园站</div>
          <div className="mt-2 text-2xl font-semibold">{stats.bySite.cn}</div>
        </div>
        <div className="metric-card">
          <div className="text-sm text-neutral-500">全球站</div>
          <div className="mt-2 text-2xl font-semibold">{stats.bySite.com}</div>
        </div>
        <div className="metric-card">
          <div className="text-sm text-neutral-500">AI 模式</div>
          <div className="mt-2 text-2xl font-semibold">{stats.byMode.ai}</div>
        </div>
        <div className="metric-card">
          <div className="text-sm text-neutral-500">Demo 模式</div>
          <div className="mt-2 text-2xl font-semibold">{stats.byMode.demo}</div>
        </div>
        <div className="metric-card">
          <div className="text-sm text-neutral-500">平均延迟</div>
          <div className="mt-2 text-2xl font-semibold">{stats.avgLatency.toFixed(0)} ms</div>
        </div>
      </div>

      <div className="detail-panel">
        <h2 className="mb-3 font-semibold">Fallback 原因分布</h2>
        {Object.keys(stats.byFallback).length === 0 ? (
          <div className="text-sm text-neutral-500">无 fallback 记录</div>
        ) : (
          <div className="table-list">
            {Object.entries(stats.byFallback).map(([reason, count]) => (
              <div className="table-row" key={reason}>
                <div className="font-medium">{reason || "未知原因"}</div>
                <span className="text-sm font-semibold">{count} 次</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function QualityReportTab({ site, token }: PageProps) {
  const load = useCallback(() => getContentQualityReport(site, token), [site, token]);
  const resource = useApiResource(load);
  const report = resource.data;

  return (
    <DataState loading={resource.loading} error={resource.error} empty={!report} emptyText="暂无质量报告数据" onRetry={resource.refresh}>
      {report && (
        <div className="grid gap-6 xl:grid-cols-2">
          <section className="detail-panel">
            <div className="mb-4 flex items-center gap-3">
              <h2 className="font-semibold">校园站质量报告</h2>
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">cn</span>
            </div>

            <div className="mb-4">
              <h3 className="mb-2 text-sm font-semibold text-neutral-700">文章状态分布</h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(report.campus.articleStatusDistribution).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2">
                    <span className="text-sm text-neutral-600">{status}</span>
                    <span className="font-semibold">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <h3 className="mb-2 text-sm font-semibold text-neutral-700">知识库分布</h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(report.campus.knowledgeBaseDistribution).map(([kb, count]) => (
                  <div key={kb} className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2">
                    <span className="text-sm text-neutral-600">{kb}</span>
                    <span className="font-semibold">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="metric-card">
              <div className="text-sm text-neutral-500">平均帮助数</div>
              <div className="mt-2 text-2xl font-semibold">{report.campus.averageHelpfulCount.toFixed(1)}</div>
            </div>
          </section>

          <section className="detail-panel">
            <div className="mb-4 flex items-center gap-3">
              <h2 className="font-semibold">全球站质量报告</h2>
              <span className="rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700">com</span>
            </div>

            <div className="mb-4">
              <h3 className="mb-2 text-sm font-semibold text-neutral-700">内容类型分布</h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(report.compass.contentTypeDistribution).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2">
                    <span className="text-sm text-neutral-600">{type}</span>
                    <span className="font-semibold">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <h3 className="mb-2 text-sm font-semibold text-neutral-700">状态分布</h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(report.compass.statusDistribution).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2">
                    <span className="text-sm text-neutral-600">{status}</span>
                    <span className="font-semibold">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="metric-card">
              <div className="text-sm text-neutral-500">平均版本数</div>
              <div className="mt-2 text-2xl font-semibold">{report.compass.averageVersionCount.toFixed(1)}</div>
            </div>
          </section>
        </div>
      )}
    </DataState>
  );
}

function AnalyticsMetricCard({ metric }: { metric: AnalyticsMetric }) {
  return (
    <div className="metric-card">
      <div className="text-sm text-neutral-500">{metric.label}</div>
      <div className="mt-2 text-3xl font-semibold">
        {metric.value}
        {metric.unit && <span className="ml-1 text-sm font-medium text-neutral-500">{metric.unit}</span>}
      </div>
      <div className="mt-1 text-xs text-neutral-400">{metric.site}</div>
    </div>
  );
}

function formatMetadata(metadata: BehaviorEventRecord["metadata"]) {
  const keys = Object.keys(metadata);
  if (!keys.length) return "无元数据";
  return keys
    .slice(0, 3)
    .map((key) => `${key}: ${String(metadata[key])}`)
    .join("，");
}
