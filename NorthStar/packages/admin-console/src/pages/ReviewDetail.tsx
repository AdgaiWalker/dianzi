import { useCallback, useState } from "react";
import { useParams } from "react-router-dom";
import {
  ArrowUpCircle,
  CheckCircle2,
  Play,
  XCircle,
} from "lucide-react";
import type { ModerationTaskRecord } from "@ns/shared";
import { DataState } from "../components/DataState";
import { PageShell } from "../components/PageShell";
import { useApiResource } from "../components/useApiResource";
import type { PageProps } from "../types";
import { getReviewTask, updateReviewTaskStatus } from "../services/api";

export function ReviewDetail({ site, token }: PageProps) {
  const { id = "" } = useParams();
  const [message, setMessage] = useState<string | null>(null);
  const load = useCallback(() => getReviewTask(site, token, id), [site, token, id]);
  const resource = useApiResource(load);

  const changeStatus = async (status: ModerationTaskRecord["status"]) => {
    setMessage(null);
    try {
      await updateReviewTaskStatus(site, token, id, status);
      setMessage("审核状态已更新");
      resource.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "审核状态更新失败");
    }
  };

  return (
    <PageShell title="审核详情">
      <DataState loading={resource.loading} error={resource.error} empty={!resource.data} emptyText="审核任务不存在" onRetry={resource.refresh}>
        {resource.data && (
          <section className="detail-panel">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold">{resource.data.title}</h2>
              <span className="status-pill">{resource.data.status}</span>
            </div>
            <dl className="detail-grid">
              <div><dt>站点</dt><dd>{resource.data.site}</dd></div>
              <div><dt>类型</dt><dd>{resource.data.type}</dd></div>
              <div><dt>目标</dt><dd>{resource.data.targetType}/{resource.data.targetId}</dd></div>
              <div><dt>原因</dt><dd>{resource.data.reason || "暂无原因"}</dd></div>
            </dl>
            <TaskPayload task={resource.data} />
            <div className="action-row">
              {resource.data.status === "pending" && (
                <>
                  <button className="primary-button" type="button" onClick={() => changeStatus("in_review")}>
                    <Play className="h-4 w-4" aria-hidden="true" />
                    开始处理
                  </button>
                  <button className="ghost-button" type="button" onClick={() => changeStatus("escalated")}>
                    <ArrowUpCircle className="h-4 w-4" aria-hidden="true" />
                    升级
                  </button>
                </>
              )}
              {resource.data.status === "in_review" && (
                <>
                  <button className="primary-button" type="button" onClick={() => changeStatus("resolved")}>
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    解决
                  </button>
                  <button className="danger-button" type="button" onClick={() => changeStatus("dismissed")}>
                    <XCircle className="h-4 w-4" aria-hidden="true" />
                    驳回
                  </button>
                </>
              )}
              {resource.data.status === "escalated" && (
                <button className="primary-button" type="button" onClick={() => changeStatus("resolved")}>
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  解决
                </button>
              )}
            </div>
            {message && <div className="mt-4 text-sm text-neutral-600">{message}</div>}
          </section>
        )}
      </DataState>
    </PageShell>
  );
}

function TaskPayload({ task }: { task: ModerationTaskRecord }) {
  const entries = task.type === "space_claim" ? spaceClaimPayloadEntries(task.payload) : genericPayloadEntries(task.payload);
  if (!entries.length) return null;

  return (
    <section className="mt-4 rounded-2xl border border-line bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-neutral-700">任务载荷</h3>
      <dl className="grid gap-3 text-sm md:grid-cols-2">
        {entries.map((entry) => (
          <div key={entry.label}>
            <dt className="text-neutral-500">{entry.label}</dt>
            <dd className="mt-1 break-words font-medium text-ink">{entry.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function spaceClaimPayloadEntries(payload: Record<string, unknown>) {
  return [
    { label: "空间 ID", value: stringValue(payload.spaceId) },
    { label: "空间标识", value: stringValue(payload.spaceSlug) },
    { label: "当前维护者", value: stringValue(payload.currentOwnerId) },
    { label: "候选维护者", value: stringValue(payload.candidateUserId) },
    { label: "最后活跃时间", value: formatPayloadDate(payload.lastActiveAt) },
  ].filter((entry) => entry.value !== "未提供");
}

function genericPayloadEntries(payload: Record<string, unknown>) {
  return Object.entries(payload).map(([key, value]) => ({
    label: key,
    value: formatPayloadValue(value),
  }));
}

function stringValue(value: unknown) {
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number") return String(value);
  return "未提供";
}

function formatPayloadDate(value: unknown) {
  const raw = stringValue(value);
  if (raw === "未提供") return raw;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? raw : date.toLocaleString("zh-CN");
}

function formatPayloadValue(value: unknown) {
  if (value === null || value === undefined) return "未提供";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}
