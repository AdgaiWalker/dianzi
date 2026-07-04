import { useCallback, useState } from "react";
import { DataState } from "../components/DataState";
import { PageShell } from "../components/PageShell";
import { Pagination } from "../components/Pagination";
import { useApiResource } from "../components/useApiResource";
import type { PageProps } from "../types";
import type { EmailDeliveryRecord } from "../services/api";
import { getEmailDeliveries } from "../services/api";

export function DeliveryPage({ site, token }: PageProps) {
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const load = useCallback(() => getEmailDeliveries(site, token), [site, token]);
  const resource = useApiResource(load);
  const items: EmailDeliveryRecord[] = resource.data?.deliveries ?? [];

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = items.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <PageShell title="通知投递">
      <DataState loading={resource.loading} error={resource.error} empty={items.length === 0} emptyText="暂无投递记录" onRetry={resource.refresh}>
        <div className="table-list">
          {paged.map((item) => (
            <div className="table-row" key={item.id}>
              <div>
                <div className="font-medium">{item.subject}</div>
                <div className="text-sm text-neutral-500">
                  {item.to}
                  <span className={`ml-2 inline-block rounded px-1.5 py-0.5 text-xs font-medium ${item.status === "sent" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                    {item.status === "sent" ? "已发送" : item.status}
                  </span>
                </div>
              </div>
              <span className="text-sm text-neutral-500">{new Date(item.createdAt).toLocaleString("zh-CN")}</span>
            </div>
          ))}
        </div>
        <Pagination page={currentPage} total={items.length} pageSize={pageSize} onChange={setPage} />
      </DataState>
    </PageShell>
  );
}
