import { useCallback, useMemo, useState, type FormEvent } from "react";
import { CheckCircle2, Download, FilePlus2, XCircle } from "lucide-react";
import type { LegalDocumentRecord, LegalDocumentType } from "@ns/shared";
import { DataState } from "../components/DataState";
import { PageShell } from "../components/PageShell";
import { Pagination } from "../components/Pagination";
import { useApiResource } from "../components/useApiResource";
import type { DeletionRequest } from "../services/api";
import {
  createLegalDocument,
  exportUserDataForAdmin,
  getDeletionRequests,
  getLegalDocuments,
  processDeletionRequest,
  updateLegalDocumentStatus,
} from "../services/api";
import type { PageProps } from "../types";

export function CompliancePage({ site, token }: PageProps) {
  const [statusFilter, setStatusFilter] = useState<"all" | DeletionRequest["status"]>("all");
  const [exportUserId, setExportUserId] = useState("");
  const [exportPayload, setExportPayload] = useState<Record<string, unknown> | null>(null);
  const [exportDownloadUrl, setExportDownloadUrl] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const load = useCallback(() => getDeletionRequests(site, token), [site, token]);
  const resource = useApiResource(load);
  const rawItems = resource.data?.items;
  const documentsLoad = useCallback(() => getLegalDocuments(site, token), [site, token]);
  const documentsResource = useApiResource(documentsLoad);
  const documents = documentsResource.data?.items ?? [];

  const filtered = useMemo(() => {
    const all = rawItems ?? [];
    if (statusFilter === "all") return all;
    return all.filter((item) => item.status === statusFilter);
  }, [rawItems, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const processRequest = async (id: string, action: "approve" | "reject") => {
    try {
      await processDeletionRequest(site, token, id, action === "approve" ? "completed" : "rejected");
      resource.refresh();
    } catch (err) {
      console.error("处理注销申请失败:", err);
    }
  };

  const triggerExport = async (event: FormEvent) => {
    event.preventDefault();
    setActionMessage(null);
    setExportPayload(null);
    if (exportDownloadUrl) URL.revokeObjectURL(exportDownloadUrl);
    setExportDownloadUrl(null);
    try {
      const result = await exportUserDataForAdmin(site, token, exportUserId.trim());
      setExportPayload(result.payload);
      const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
      setExportDownloadUrl(URL.createObjectURL(blob));
      setActionMessage("数据导出已生成");
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : "数据导出失败");
    }
  };

  return (
    <PageShell title="合规处理 - 注销申请">
      {actionMessage && <div className="notice-line">{actionMessage}</div>}
      <div className="mb-6 grid gap-4 xl:grid-cols-2">
        <section className="detail-panel">
          <h2 className="mb-3 font-semibold">数据导出</h2>
          <form className="flex flex-wrap items-end gap-3" onSubmit={triggerExport}>
            <label className="field-label mb-0 min-w-64 flex-1">
              用户 ID
              <input className="text-input" value={exportUserId} onChange={(event) => setExportUserId(event.target.value)} />
            </label>
            <button className="primary-button" type="submit">
              <Download className="h-4 w-4" aria-hidden="true" />
              导出
            </button>
          </form>
          {exportPayload && (
            <>
              {exportDownloadUrl && (
                <a className="ghost-button mt-4 inline-flex" href={exportDownloadUrl} download={`user-${exportUserId || "export"}.json`}>
                  <Download className="h-4 w-4" aria-hidden="true" />
                  下载导出文件
                </a>
              )}
              <pre className="mt-4 max-h-72 overflow-auto rounded-md bg-neutral-50 p-3 text-xs text-neutral-700">
                {JSON.stringify(exportPayload, null, 2)}
              </pre>
            </>
          )}
        </section>

        <LegalDocumentsPanel site={site} token={token} documents={documents} onChanged={documentsResource.refresh} />
      </div>
      <div className="toolbar">
        <select className="select-input" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as typeof statusFilter); setPage(1); }}>
          <option value="all">全部状态</option>
          <option value="pending">待处理</option>
          <option value="in_review">复核中</option>
          <option value="processing">处理中</option>
          <option value="completed">已完成</option>
          <option value="rejected">已驳回</option>
        </select>
      </div>
      <DataState loading={resource.loading} error={resource.error} empty={filtered.length === 0} emptyText="暂无注销申请" onRetry={resource.refresh}>
        <div className="table-list">
          {paged.map((item) => (
            <div className="table-row" key={item.id}>
              <div>
                <div className="font-medium">用户 {item.userId}</div>
                <div className="text-sm text-neutral-500">
                  {item.reason || "未填写原因"} · {item.site}
                  <span className={`ml-2 inline-block rounded px-1.5 py-0.5 text-xs font-medium ${deletionStatusClass(item.status)}`}>
                    {deletionStatusLabel(item.status)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-500">{new Date(item.requestedAt).toLocaleString("zh-CN")}</span>
                {item.status === "pending" && (
                  <div className="flex gap-1">
                    <button className="ghost-button" type="button" onClick={() => void processRequest(item.id, "approve")}>
                      <CheckCircle2 className="h-4 w-4 text-green-600" aria-hidden="true" />
                      批准
                    </button>
                    <button className="ghost-button" type="button" onClick={() => void processRequest(item.id, "reject")}>
                      <XCircle className="h-4 w-4 text-rose-600" aria-hidden="true" />
                      驳回
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <Pagination page={currentPage} total={filtered.length} pageSize={pageSize} onChange={setPage} />
      </DataState>
    </PageShell>
  );
}

function LegalDocumentsPanel({
  site,
  token,
  documents,
  onChanged,
}: PageProps & {
  documents: LegalDocumentRecord[];
  onChanged: () => void;
}) {
  const [type, setType] = useState<LegalDocumentType>("terms");
  const [version, setVersion] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const targetSite = site === "com" ? "com" : "cn";

  const createDocument = async (event: FormEvent) => {
    event.preventDefault();
    setMessage(null);
    try {
      await createLegalDocument(site, token, { site: targetSite, type, version, title, content, status: "published" });
      setVersion("");
      setTitle("");
      setContent("");
      setMessage("法律文档已发布");
      onChanged();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "法律文档保存失败");
    }
  };

  const archiveDocument = async (document: LegalDocumentRecord) => {
    setMessage(null);
    try {
      await updateLegalDocumentStatus(site, token, document.id, document.status === "archived" ? "published" : "archived");
      setMessage(document.status === "archived" ? "法律文档已发布" : "法律文档已归档");
      onChanged();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "法律文档状态更新失败");
    }
  };

  return (
    <section className="detail-panel">
      <h2 className="mb-3 font-semibold">法律文档</h2>
      <form className="grid gap-3" onSubmit={createDocument}>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="field-label mb-0">
            类型
            <select className="select-input mt-2 w-full" value={type} onChange={(event) => setType(event.target.value as LegalDocumentType)}>
              <option value="terms">用户协议</option>
              <option value="privacy">隐私政策</option>
            </select>
          </label>
          <label className="field-label mb-0">
            版本
            <input className="text-input" value={version} onChange={(event) => setVersion(event.target.value)} />
          </label>
        </div>
        <label className="field-label mb-0">
          标题
          <input className="text-input" value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label className="field-label mb-0">
          正文
          <textarea className="json-editor min-h-28 font-sans" value={content} onChange={(event) => setContent(event.target.value)} />
        </label>
        <button className="primary-button justify-self-start" type="submit">
          <FilePlus2 className="h-4 w-4" aria-hidden="true" />
          发布版本
        </button>
      </form>
      {message && <div className="mt-3 text-sm text-neutral-600">{message}</div>}
      <div className="mt-4 table-list">
        {documents.length === 0 ? (
          <div className="px-4 py-3 text-sm text-neutral-500">暂无法律文档</div>
        ) : (
          documents.slice(0, 5).map((document) => (
            <div className="table-row" key={document.id}>
              <div>
                <div className="font-medium">{document.title}</div>
                <div className="text-sm text-neutral-500">
                  {document.type} · {document.version} · {document.status}
                </div>
              </div>
              <button className="ghost-button" type="button" onClick={() => void archiveDocument(document)}>
                {document.status === "archived" ? "发布" : "归档"}
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function deletionStatusLabel(status: DeletionRequest["status"]) {
  const labels: Record<DeletionRequest["status"], string> = {
    pending: "待处理",
    in_review: "复核中",
    processing: "处理中",
    completed: "已完成",
    rejected: "已驳回",
  };
  return labels[status];
}

function deletionStatusClass(status: DeletionRequest["status"]) {
  if (status === "completed") return "bg-green-50 text-green-700";
  if (status === "rejected") return "bg-rose-50 text-rose-700";
  if (status === "processing" || status === "in_review") return "bg-blue-50 text-blue-700";
  return "bg-amber-50 text-amber-700";
}
