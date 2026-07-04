import { useCallback, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { DataState } from "../components/DataState";
import { PageShell } from "../components/PageShell";
import { Pagination } from "../components/Pagination";
import { useApiResource } from "../components/useApiResource";
import { getReviewTasks } from "../services/api";
import type { PageProps } from "../types";

export function ReviewQueue({ site, token }: PageProps) {
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const load = useCallback(() => getReviewTasks(site, token), [site, token]);
  const resource = useApiResource(load);
  const items = useMemo(() => {
    const nextItems = resource.data?.items ?? [];
    return nextItems.filter((item) => (status === "all" || item.status === status) && (type === "all" || item.type === type));
  }, [resource.data?.items, status, type]);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = items.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <PageShell title="审核队列">
      <div className="toolbar">
        <select className="select-input" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
          <option value="all">全部状态</option>
          <option value="pending">待处理</option>
          <option value="in_review">处理中</option>
          <option value="escalated">已升级</option>
          <option value="resolved">已解决</option>
          <option value="dismissed">已驳回</option>
        </select>
        <select className="select-input" value={type} onChange={(event) => { setType(event.target.value); setPage(1); }}>
          <option value="all">全部类型</option>
          <option value="report">举报</option>
          <option value="changed_feedback">有变化</option>
          <option value="ai_output_review">AI 抽检</option>
          <option value="application_review">申请审核</option>
          <option value="space_claim">空间认领</option>
        </select>
      </div>
      <DataState loading={resource.loading} error={resource.error} empty={items.length === 0} emptyText="暂无审核任务" onRetry={resource.refresh}>
        <div className="table-list">
          {paged.map((item) => (
            <NavLink key={item.id} to={`/review/${item.id}`} className="table-row">
              <div>
                <div className="font-medium">{item.title}</div>
                <div className="text-sm text-neutral-500">
                  {item.type} · {item.targetType}/{item.targetId}
                </div>
              </div>
              <span className="status-pill">{item.status}</span>
            </NavLink>
          ))}
        </div>
        <Pagination page={currentPage} total={items.length} pageSize={pageSize} onChange={setPage} />
      </DataState>
    </PageShell>
  );
}
