import { useCallback, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import type { PaymentOrderRecord, QuotaRecord } from "@dianzi/shared";
import { DataState } from "../components/DataState";
import { PageShell } from "../components/PageShell";
import { useApiResource } from "../components/useApiResource";
import type { PageProps } from "../types";
import { confirmPaymentOrder, getBillingOverview } from "../services/api";

export function BillingPage({ site, token }: PageProps) {
  const load = useCallback(() => getBillingOverview(site, token), [site, token]);
  const resource = useApiResource(load);
  const quotas = resource.data?.quotas ?? [];
  const orders = resource.data?.orders ?? [];
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const confirmOrder = async (orderId: string) => {
    setProcessingOrderId(orderId);
    setActionError(null);
    try {
      await confirmPaymentOrder(site, token, orderId);
      await resource.refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "订单确认失败，请稍后重试");
    } finally {
      setProcessingOrderId(null);
    }
  };

  return (
    <PageShell title="支付管理">
      <DataState loading={resource.loading} error={resource.error} empty={!resource.data} emptyText="暂无额度与订单数据" onRetry={resource.refresh}>
        {actionError && <div className="error-line mb-4">{actionError}</div>}
        <div className="grid gap-4 xl:grid-cols-2">
          <section className="detail-panel">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="font-semibold">AI 额度</h2>
              <span className="text-sm text-neutral-500">{quotas.length} 条</span>
            </div>
            {quotas.length === 0 ? (
              <div className="text-sm text-neutral-500">暂无额度记录</div>
            ) : (
              <div className="table-list">
                {quotas.map((quota) => <QuotaRow key={quota.id} quota={quota} />)}
              </div>
            )}
          </section>

          <section className="detail-panel">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="font-semibold">手动支付订单</h2>
              <span className="text-sm text-neutral-500">{orders.length} 条</span>
            </div>
            {orders.length === 0 ? (
              <div className="text-sm text-neutral-500">暂无订单</div>
            ) : (
              <div className="table-list">
                {orders.map((order) => (
                  <PaymentOrderRow
                    key={order.id}
                    order={order}
                    confirming={processingOrderId === order.id}
                    onConfirm={() => void confirmOrder(order.id)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </DataState>
    </PageShell>
  );
}

function QuotaRow({ quota }: { quota: QuotaRecord }) {
  return (
    <div className="table-row">
      <div>
        <div className="font-medium">用户 {quota.userId}</div>
        <div className="text-sm text-neutral-500">{quota.site} · 更新于 {new Date(quota.updatedAt).toLocaleString("zh-CN")}</div>
      </div>
      <span className="text-sm font-semibold text-teal">{quota.aiCreditsRemaining} 点</span>
    </div>
  );
}

function PaymentOrderRow({
  order,
  confirming,
  onConfirm,
}: {
  order: PaymentOrderRecord;
  confirming: boolean;
  onConfirm: () => void;
}) {
  return (
    <div className="table-row">
      <div>
        <div className="font-medium">订单 {order.id} · {order.status}</div>
        <div className="text-sm text-neutral-500">
          用户 {order.userId} · {order.site} · {order.provider} · {order.credits} 点
        </div>
      </div>
      <span className="text-sm text-neutral-500">
        {(order.amountCents / 100).toFixed(2)} {order.currency}
      </span>
      {order.status === "pending" && (
        <button className="ghost-button" type="button" onClick={onConfirm} disabled={confirming}>
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          {confirming ? "确认中" : "确认支付"}
        </button>
      )}
    </div>
  );
}
