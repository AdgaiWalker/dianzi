import { useCallback, useMemo } from "react";
import type { AdminSummary } from "@dianzi/shared";
import { DataState } from "../components/DataState";
import { PageShell } from "../components/PageShell";
import { useApiResource } from "../components/useApiResource";
import { getAdminSummary } from "../services/api";
import type { PageProps } from "../types";

export function Dashboard({ site, token }: PageProps) {
  const load = useCallback(() => getAdminSummary(site, token), [site, token]);
  const resource = useApiResource(load);

  return (
    <PageShell title="总览">
      <DataState loading={resource.loading} error={resource.error} empty={!resource.data} emptyText="暂无后台总览数据" onRetry={resource.refresh}>
        {resource.data && <SummaryGrid summary={resource.data} />}
      </DataState>
    </PageShell>
  );
}

function SummaryGrid({ summary }: { summary: AdminSummary }) {
  const metrics = useMemo(
    () => [
      { label: "待审任务", value: summary.reviewPendingCount },
      { label: "审计日志", value: summary.auditLogCount },
      { label: "用户数量", value: summary.userCount },
      { label: "内容数量", value: summary.contentCount },
    ],
    [summary],
  );

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {metrics.map((item) => (
        <div className="metric-card" key={item.label}>
          <div className="text-sm text-neutral-500">{item.label}</div>
          <div className="mt-2 text-3xl font-semibold">{item.value}</div>
        </div>
      ))}
    </div>
  );
}
