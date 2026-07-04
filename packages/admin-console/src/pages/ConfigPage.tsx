import { useCallback, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import type { SiteConfigRecord } from "@dianzi/shared";
import { DataState } from "../components/DataState";
import { PageShell } from "../components/PageShell";
import { useApiResource } from "../components/useApiResource";
import type { PageProps } from "../types";
import { getSiteConfigs, updateSiteConfig } from "../services/api";

export function ConfigPage({ site, token }: PageProps) {
  const load = useCallback(() => getSiteConfigs(site, token), [site, token]);
  const resource = useApiResource(load);
  const items = resource.data?.items ?? [];

  return (
    <PageShell title="系统配置">
      <DataState loading={resource.loading} error={resource.error} empty={items.length === 0} emptyText="暂无系统配置" onRetry={resource.refresh}>
        <div className="grid gap-4">
          {items.map((item) => (
            <ConfigEditor key={item.id} item={item} site={site} token={token} onSaved={resource.refresh} />
          ))}
        </div>
      </DataState>
    </PageShell>
  );
}

function ConfigEditor({ item, site, token, onSaved }: PageProps & { item: SiteConfigRecord; onSaved: () => void }) {
  const [value, setValue] = useState(() => JSON.stringify(item.value, null, 2));
  const [message, setMessage] = useState<string | null>(null);

  const save = async () => {
    setMessage(null);
    try {
      const parsed = JSON.parse(value) as Record<string, unknown>;
      await updateSiteConfig(site, token, item.id, { value: parsed });
      setMessage("配置已保存");
      onSaved();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "配置保存失败");
    }
  };

  return (
    <section className="detail-panel">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">{item.key}</h2>
          <p className="text-sm text-neutral-500">{item.site} · {new Date(item.updatedAt).toLocaleString("zh-CN")}</p>
        </div>
        <button className="primary-button" type="button" onClick={save}>
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          保存
        </button>
      </div>
      <textarea className="json-editor" value={value} onChange={(event) => setValue(event.target.value)} />
      {message && <div className="mt-3 text-sm text-neutral-600">{message}</div>}
    </section>
  );
}
