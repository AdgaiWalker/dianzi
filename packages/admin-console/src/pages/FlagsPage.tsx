import { useCallback } from "react";
import { DataState } from "../components/DataState";
import { PageShell } from "../components/PageShell";
import { useApiResource } from "../components/useApiResource";
import type { PageProps } from "../types";
import type { FeatureFlag } from "../services/api";
import { getFeatureFlags, updateSiteConfig } from "../services/api";

export function FlagsPage({ site, token }: PageProps) {
  const cnLoad = useCallback(() => getFeatureFlags("cn", token), [token]);
  const cnResource = useApiResource(cnLoad);
  const cnFlags: FeatureFlag[] = cnResource.data?.items ?? [];

  const comLoad = useCallback(() => getFeatureFlags("com", token), [token]);
  const comResource = useApiResource(comLoad);
  const comFlags: FeatureFlag[] = comResource.data?.items ?? [];

  const toggleFlag = async (flag: FeatureFlag) => {
    try {
      await updateSiteConfig(site, token, flag.id, { value: { enabled: !flag.enabled } });
      cnResource.refresh();
      comResource.refresh();
    } catch (err) {
      console.error("切换功能开关失败:", err);
    }
  };

  const FlagRow = ({ flag }: { flag: FeatureFlag }) => (
    <div className="table-row" key={flag.id}>
      <div>
        <div className="font-medium">{flag.key}</div>
        <div className="text-sm text-neutral-500">{flag.description || "无描述"}</div>
      </div>
      <button
        className={`w-12 rounded-full px-3 py-1 text-sm font-medium transition-colors ${
          flag.enabled ? "bg-teal text-white" : "bg-neutral-200 text-neutral-600"
        }`}
        type="button"
        onClick={() => void toggleFlag(flag)}
      >
        {flag.enabled ? "ON" : "OFF"}
      </button>
    </div>
  );

  return (
    <PageShell title="功能开关">
      <div className="grid gap-6 xl:grid-cols-2">
        <DataState loading={cnResource.loading} error={cnResource.error} empty={cnFlags.length === 0} emptyText="暂无功能开关" onRetry={cnResource.refresh}>
          <section className="detail-panel">
            <div className="mb-3 flex items-center gap-3">
              <h2 className="font-semibold">校园站</h2>
              <span className="text-sm text-neutral-500">{cnFlags.length} 个开关</span>
            </div>
            <div className="table-list">
              {cnFlags.map((flag) => <FlagRow key={flag.id} flag={flag} />)}
            </div>
          </section>
        </DataState>

        <DataState loading={comResource.loading} error={comResource.error} empty={comFlags.length === 0} emptyText="暂无功能开关" onRetry={comResource.refresh}>
          <section className="detail-panel">
            <div className="mb-3 flex items-center gap-3">
              <h2 className="font-semibold">全球站</h2>
              <span className="text-sm text-neutral-500">{comFlags.length} 个开关</span>
            </div>
            <div className="table-list">
              {comFlags.map((flag) => <FlagRow key={flag.id} flag={flag} />)}
            </div>
          </section>
        </DataState>
      </div>
    </PageShell>
  );
}
