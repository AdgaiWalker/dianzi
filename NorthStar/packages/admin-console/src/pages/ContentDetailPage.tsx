import { useCallback, useState } from "react";
import { NavLink, useParams, useSearchParams } from "react-router-dom";
import { ArrowUpCircle, CheckCircle2, Play, XCircle } from "lucide-react";
import type { AdminCampusArticleDetail } from "@ns/shared";
import { DataState } from "../components/DataState";
import { PageShell } from "../components/PageShell";
import { useApiResource } from "../components/useApiResource";
import type { PageProps } from "../types";
import {
  getCampusArticleDetail,
  getCompassContentDetail,
  submitCompassContent,
  updateCompassContentStatus,
} from "../services/api";

import { ContentEditor } from "./ContentEditor";

type ContentSource = "campus" | "compass";

function formatPayloadValue(value: unknown) {
  if (value === null || value === undefined) return "未提供";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

export function ContentDetailPage({ site, token }: PageProps) {
  const { id = "" } = useParams();
  const [searchParams] = useSearchParams();
  const source = searchParams.get("source") as ContentSource | null;
  const [message, setMessage] = useState<string | null>(null);

  const compassLoad = useCallback(async () => {
    if (source === "compass") {
      return getCompassContentDetail(site, token, id);
    }
    return null;
  }, [site, token, id, source]);
  const compassResource = useApiResource(compassLoad);

  const campusLoad = useCallback(async () => {
    if (source === "campus") {
      return getCampusArticleDetail(site, token, id);
    }
    return null;
  }, [site, token, id, source]);
  const campusResource = useApiResource(campusLoad);

  const isCompass = source === "compass";
  const isCampus = source === "campus";
  const compassDetail = compassResource.data;
  const campusDetail: AdminCampusArticleDetail | null | undefined = campusResource.data;

  const changeStatus = async (newStatus: string) => {
    setMessage(null);
    try {
      await updateCompassContentStatus(site, token, id, newStatus);
      setMessage("内容状态已更新");
      compassResource.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "状态更新失败");
    }
  };

  const submitForReview = async () => {
    setMessage(null);
    try {
      await submitCompassContent(site, token, id);
      setMessage("内容已提交审核");
      compassResource.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "提交审核失败");
    }
  };

  const compassRecord = compassDetail?.record;
  const metaEntries = compassRecord?.metadata ? Object.entries(compassRecord.metadata) : [];

  return (
    <PageShell title="内容详情">
      <NavLink to="/content" className="ghost-button mb-4 inline-flex items-center gap-1">
        <ArrowUpCircle className="h-4 w-4 rotate-180" aria-hidden="true" />
        返回内容列表
      </NavLink>

      {!isCompass && !isCampus && (
        <section className="detail-panel">
          <p className="text-sm text-neutral-500">内容详情暂不支持查看。</p>
        </section>
      )}

      {isCompass && (
        <DataState loading={compassResource.loading} error={compassResource.error} empty={!compassDetail} emptyText="内容不存在" onRetry={compassResource.refresh}>
          {compassDetail && compassRecord && (
            <section className="detail-panel">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold">{compassRecord.title}</h2>
                <span className={`status-pill ${compassRecord.status === "published" ? "text-green-700 bg-green-50" : compassRecord.status === "rejected" ? "text-rose-700 bg-rose-50" : "text-amber-700 bg-amber-50"}`}>{compassRecord.status}</span>
              </div>
              <dl className="detail-grid mt-4">
                <div><dt>来源</dt><dd>全球站</dd></div>
                <div><dt>类型</dt><dd>{compassRecord.contentType}</dd></div>
                <div><dt>Slug</dt><dd>{compassRecord.slug}</dd></div>
                <div><dt>领域</dt><dd>{compassRecord.domain || "无"}</dd></div>
                <div><dt>作者</dt><dd>{compassRecord.ownerId || "未知"}</dd></div>
                <div><dt>创建时间</dt><dd>{compassRecord.createdAt ? new Date(compassRecord.createdAt).toLocaleString("zh-CN") : "未知"}</dd></div>
                <div><dt>更新时间</dt><dd>{compassRecord.updatedAt ? new Date(compassRecord.updatedAt).toLocaleString("zh-CN") : "未知"}</dd></div>
              </dl>

              {compassRecord.summary && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-neutral-700 mb-1">摘要</h3>
                  <p className="text-sm text-neutral-600">{compassRecord.summary}</p>
                </div>
              )}

              {compassRecord.body && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-neutral-700 mb-1">正文</h3>
                  <div className="whitespace-pre-wrap text-sm text-neutral-600 max-h-64 overflow-y-auto rounded-lg bg-neutral-50 p-3">{compassRecord.body}</div>
                </div>
              )}

              {compassRecord.status !== "published" && (
                <div className="mt-4">
                  <ContentEditor
                    mode="edit"
                    site={site}
                    token={token}
                    record={compassRecord}
                    onSaved={compassResource.refresh}
                  />
                </div>
              )}

              {metaEntries.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-neutral-700 mb-2">元数据</h3>
                  <dl className="grid gap-2 text-sm md:grid-cols-2">
                    {metaEntries.map(([key, value]) => (
                      <div key={key}>
                        <dt className="text-neutral-500">{key}</dt>
                        <dd className="mt-0.5 break-words font-medium">{formatPayloadValue(value)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              {compassDetail && compassDetail.versions.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-neutral-700 mb-2">版本历史</h3>
                  <div className="table-list">
                    {compassDetail.versions.map((v) => (
                      <div className="table-row" key={v.id}>
                        <div>
                          <div className="font-medium">版本 {v.version}</div>
                          <div className="text-sm text-neutral-500">编辑者 {v.editorId ?? "系统"} · ID: {v.id}</div>
                        </div>
                        <span className="text-sm text-neutral-500">{new Date(v.createdAt).toLocaleString("zh-CN")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="action-row mt-6">
                {compassRecord.status === "draft" && (
                  <button className="ghost-button" type="button" onClick={() => void submitForReview()}>
                    <Play className="h-4 w-4" aria-hidden="true" />
                    提交审核
                  </button>
                )}
                {(compassRecord.status === "pending" || compassRecord.status === "draft") && (
                  <button className="primary-button" type="button" onClick={() => changeStatus("published")}>
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    发布
                  </button>
                )}
                {compassRecord.status === "pending" && (
                  <button className="danger-button" type="button" onClick={() => changeStatus("rejected")}>
                    <XCircle className="h-4 w-4" aria-hidden="true" />
                    驳回
                  </button>
                )}
                {compassRecord.status === "published" && (
                  <button className="ghost-button" type="button" onClick={() => changeStatus("archived")}>
                    归档
                  </button>
                )}
                {compassRecord.status === "rejected" && (
                  <button className="primary-button" type="button" onClick={() => changeStatus("published")}>
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    重新发布
                  </button>
                )}
              </div>
              {message && <div className="mt-4 text-sm text-neutral-600">{message}</div>}
            </section>
          )}
        </DataState>
      )}

      {isCampus && (
        <DataState loading={campusResource.loading} error={campusResource.error} empty={!campusDetail} emptyText="内容不存在" onRetry={campusResource.refresh}>
          {campusDetail && (
            <section className="detail-panel">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold">{campusDetail.title}</h2>
                <span className={`status-pill ${
                  campusDetail.status === "published" ? "text-green-700 bg-green-50" :
                  campusDetail.status === "draft" ? "text-amber-700 bg-amber-50" :
                  "text-neutral-700 bg-neutral-50"
                }`}>{campusDetail.status}</span>
              </div>
              <dl className="detail-grid mt-4">
                <div><dt>来源</dt><dd>校园站</dd></div>
                <div><dt>作者</dt><dd>{campusDetail.authorId}</dd></div>
                <div><dt>帮助数</dt><dd>{campusDetail.helpfulCount}</dd></div>
                <div><dt>状态</dt><dd>{campusDetail.status}</dd></div>
                <div><dt>创建时间</dt><dd>{new Date(campusDetail.createdAt).toLocaleString("zh-CN")}</dd></div>
                <div><dt>更新时间</dt><dd>{new Date(campusDetail.updatedAt).toLocaleString("zh-CN")}</dd></div>
              </dl>

              <div className="mt-4">
                <h3 className="text-sm font-semibold text-neutral-700 mb-1">正文</h3>
                <div className="whitespace-pre-wrap text-sm text-neutral-600 max-h-96 overflow-y-auto rounded-lg bg-neutral-50 p-3">{campusDetail.content}</div>
              </div>
            </section>
          )}
        </DataState>
      )}
    </PageShell>
  );
}
