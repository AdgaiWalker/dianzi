import { useState, type FormEvent } from "react";
import { CheckCircle2 } from "lucide-react";
import type { CompassContentRecord, CompassContentType, Domain, CreateContentRequest } from "@dianzi/shared";
import { createCompassContent, updateCompassContent } from "../services/api";
import type { PageProps } from "../types";

const compassContentTypes: CompassContentType[] = ["tool", "topic", "article", "news"];
const compassDomains: Domain[] = ["creative", "dev", "work"];

export function ContentEditor({
  mode,
  site,
  token,
  record,
  onSaved,
}: PageProps & {
  mode: "create" | "edit";
  record?: CompassContentRecord;
  onSaved: () => void;
}) {
  const [contentType, setContentType] = useState<CompassContentType>(record?.contentType ?? "article");
  const [title, setTitle] = useState(record?.title ?? "");
  const [summary, setSummary] = useState(record?.summary ?? "");
  const [body, setBody] = useState(record?.body ?? "");
  const [domain, setDomain] = useState<Domain>(record?.domain ?? "creative");
  const [metadata, setMetadata] = useState(() => JSON.stringify(record?.metadata ?? { tags: [] }, null, 2));
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const parsedMetadata = JSON.parse(metadata) as Record<string, unknown>;
      const payload: CreateContentRequest = {
        contentType,
        title,
        summary,
        body,
        domain,
        metadata: parsedMetadata,
      };

      if (mode === "create") {
        await createCompassContent(site, token, payload);
        setMessage("内容已创建");
      } else if (record) {
        await updateCompassContent(site, token, record.id, {
          title,
          summary,
          body,
          domain,
          metadata: parsedMetadata,
        });
        setMessage("内容已保存");
      }
      onSaved();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "内容保存失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="detail-panel mb-4" onSubmit={save}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-semibold">{mode === "create" ? "新建全球站内容" : "编辑全球站内容"}</h2>
        <button className="primary-button" type="submit" disabled={saving}>
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          {saving ? "保存中" : "保存"}
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="field-label">
          内容类型
          <select className="select-input mt-2 w-full" value={contentType} onChange={(event) => setContentType(event.target.value as CompassContentType)}>
            {compassContentTypes.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
        </label>
        <label className="field-label">
          领域
          <select className="select-input mt-2 w-full" value={domain} onChange={(event) => setDomain(event.target.value as Domain)}>
            {compassDomains.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
      </div>
      <label className="field-label">
        标题
        <input className="text-input" value={title} onChange={(event) => setTitle(event.target.value)} />
      </label>
      <label className="field-label">
        摘要
        <textarea className="json-editor min-h-24 font-sans" value={summary} onChange={(event) => setSummary(event.target.value)} />
      </label>
      <label className="field-label">
        正文
        <textarea className="json-editor min-h-56 font-sans" value={body} onChange={(event) => setBody(event.target.value)} />
      </label>
      <label className="field-label">
        Metadata
        <textarea className="json-editor" value={metadata} onChange={(event) => setMetadata(event.target.value)} />
      </label>
      {message && <div className="mt-3 text-sm text-neutral-600">{message}</div>}
    </form>
  );
}
