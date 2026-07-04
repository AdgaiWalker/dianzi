import { useCallback, useMemo, useState } from "react";
import { DataState } from "../components/DataState";
import { PageShell } from "../components/PageShell";
import { Pagination } from "../components/Pagination";
import { useApiResource } from "../components/useApiResource";
import type { PageProps } from "../types";
import { getAuditLogs } from "../services/api";

export function AuditPage({ site, token }: PageProps) {
  const [filterAction, setFilterAction] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const load = useCallback(() => getAuditLogs(site, token), [site, token]);
  const resource = useApiResource(load);
  const rawItems = resource.data?.items;

  const actionTypes = useMemo(() => [...new Set((rawItems ?? []).map((item) => item.action))], [rawItems]);

  const filtered = useMemo(() => {
    const all = rawItems ?? [];
    if (filterAction === "all") return all;
    return all.filter((item) => item.action === filterAction);
  }, [rawItems, filterAction]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <PageShell title="审计日志">
      <div className="toolbar">
        <select className="select-input" value={filterAction} onChange={(e) => { setFilterAction(e.target.value); setPage(1); }}>
          <option value="all">全部操作</option>
          {actionTypes.map((action) => (
            <option key={action} value={action}>{action}</option>
          ))}
        </select>
      </div>
      <DataState loading={resource.loading} error={resource.error} empty={filtered.length === 0} emptyText="暂无审计日志" onRetry={resource.refresh}>
        <div className="table-list">
          {paged.map((item) => (
            <div key={item.id}>
              <button
                type="button"
                className="table-row w-full cursor-pointer text-left"
                onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
              >
                <div>
                  <div className="font-medium">{item.action}</div>
                  <div className="text-sm text-neutral-500">
                    {item.targetType}/{item.targetId}
                    {item.actorId && <span className="ml-2">操作者 {item.actorId}</span>}
                  </div>
                </div>
                <span className="text-sm text-neutral-500">{new Date(item.createdAt).toLocaleString("zh-CN")}</span>
              </button>
              {expandedId === item.id && (
                <div className="border-b border-line bg-neutral-50 px-4 py-3 text-sm">
                  {(!item.before && !item.after) && (
                    <div className="text-neutral-500">无变更记录</div>
                  )}
                  {item.before && (
                    <div className="mb-2">
                      <div className="mb-1 font-medium text-neutral-700">变更前</div>
                      <pre className="overflow-x-auto rounded-lg bg-white p-3 text-xs text-neutral-600">{JSON.stringify(item.before, null, 2)}</pre>
                    </div>
                  )}
                  {item.after && (
                    <div>
                      <div className="mb-1 font-medium text-neutral-700">变更后</div>
                      <pre className="overflow-x-auto rounded-lg bg-white p-3 text-xs text-neutral-600">{JSON.stringify(item.after, null, 2)}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        <Pagination page={currentPage} total={filtered.length} pageSize={pageSize} onChange={setPage} />
      </DataState>
    </PageShell>
  );
}
