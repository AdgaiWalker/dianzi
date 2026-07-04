import { useCallback, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { FilePlus2 } from "lucide-react";
import type { AdminContentRecord } from "@ns/shared";
import { DataState } from "../components/DataState";
import { PageShell } from "../components/PageShell";
import { Pagination } from "../components/Pagination";
import { useApiResource } from "../components/useApiResource";
import { getAdminContent, getCompassContent } from "../services/api";
import type { PageProps } from "../types";

import { ContentEditor } from "./ContentEditor";

type ContentSource = "campus" | "compass";

interface ContentItem extends AdminContentRecord {
  _source: ContentSource;
}

export function ContentPage({ site, token }: PageProps) {
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const load = useCallback(() => getAdminContent(site, token), [site, token]);
  const resource = useApiResource(load);
  const rawItems = resource.data?.items;

  const compassLoad = useCallback(() => getCompassContent(site, token), [site, token]);
  const compassResource = useApiResource(compassLoad);
  const rawCompassItems = compassResource.data?.items;

  const allItems: ContentItem[] = useMemo(() => [
    ...(rawItems ?? []).map((item: AdminContentRecord) => ({ ...item, _source: "campus" as ContentSource })),
    ...(rawCompassItems ?? []).map((item: AdminContentRecord) => ({ ...item, _source: "compass" as ContentSource })),
  ], [rawItems, rawCompassItems]);

  const filtered = useMemo(() => {
    return allItems.filter((item) => {
      if (filterType !== "all" && item.type !== filterType) return false;
      if (filterStatus !== "all" && item.status !== filterStatus) return false;
      return true;
    });
  }, [allItems, filterType, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <PageShell title="内容管理">
      <div className="toolbar">
        <button className="primary-button" type="button" onClick={() => setShowCreate((value) => !value)}>
          <FilePlus2 className="h-4 w-4" aria-hidden="true" />
          新建内容
        </button>
        <select className="select-input" value={filterType} onChange={(e) => { setFilterType(e.target.value); setPage(1); }}>
          <option value="all">全部类型</option>
          <option value="tool">工具</option>
          <option value="topic">专题</option>
          <option value="article">文章</option>
          <option value="news">资讯</option>
        </select>
        <select className="select-input" value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}>
          <option value="all">全部状态</option>
          <option value="published">已发布</option>
          <option value="draft">草稿</option>
          <option value="pending">待审核</option>
          <option value="rejected">已驳回</option>
          <option value="archived">已归档</option>
        </select>
      </div>
      {showCreate && (
        <ContentEditor
          mode="create"
          site={site}
          token={token}
          onSaved={() => {
            setShowCreate(false);
            compassResource.refresh();
          }}
        />
      )}
      <DataState loading={resource.loading || compassResource.loading} error={resource.error || compassResource.error} empty={filtered.length === 0} emptyText="暂无内容" onRetry={() => { resource.refresh(); compassResource.refresh(); }}>
        <div className="table-list">
          {paged.map((item) => (
            <NavLink key={`${item._source}-${item.id}`} to={`/content/${item.id}?source=${item._source}`} className="table-row">
              <div>
                <div className="font-medium">
                  <span className={`mr-2 inline-block rounded px-1.5 py-0.5 text-xs font-medium ${item._source === "campus" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"}`}>
                    {item._source === "campus" ? "校园" : "全球"}
                  </span>
                  {item.title}
                </div>
                <div className="text-sm text-neutral-500">{item.type} · {item.status} · 作者 {item.authorId}</div>
              </div>
              <span className="text-sm text-neutral-500">{new Date(item.createdAt).toLocaleString("zh-CN")}</span>
            </NavLink>
          ))}
        </div>
        {totalPages > 1 && <Pagination page={currentPage} total={filtered.length} pageSize={pageSize} onChange={setPage} />}
      </DataState>
    </PageShell>
  );
}
