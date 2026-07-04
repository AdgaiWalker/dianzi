import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CreditCard, Lock, Sparkles } from 'lucide-react';
import { billingApi } from '@/services/api';
import type { PaymentOrderRecord, QuotaLedgerRecord, QuotaRecord } from '@dianzi/shared';
import { getErrorMessage } from '@dianzi/shared';

interface CreditsTabProps {
  isLoggedIn: boolean;
  isEyeCare: boolean;
  navigate: ReturnType<typeof useNavigate>;
}

type BillingState = {
  key: string;
  quota: QuotaRecord | null;
  ledger: QuotaLedgerRecord[];
  orders: PaymentOrderRecord[];
  error: string;
  creating: boolean;
};

export const CreditsTab: React.FC<CreditsTabProps> = ({ isLoggedIn, isEyeCare, navigate }) => {
  const [billingState, setBillingState] = useState<BillingState>({
    key: '', quota: null, ledger: [], orders: [], error: '', creating: false,
  });

  useEffect(() => {
    if (!isLoggedIn) return;
    let cancelled = false;
    Promise.all([billingApi.getQuota(), billingApi.listOrders()])
      .then(([quotaResult, orderResult]) => {
        if (cancelled) return;
        setBillingState({ key: 'loaded', quota: quotaResult.quota, ledger: quotaResult.ledger, orders: orderResult.items, error: '', creating: false });
      })
      .catch((error) => {
        if (cancelled) return;
        setBillingState({ key: 'loaded', quota: null, ledger: [], orders: [], error: getErrorMessage(error, '额度信息加载失败，请稍后重试。'), creating: false });
      });
    return () => { cancelled = true; };
  }, [isLoggedIn]);

  const createQuotaOrder = async () => {
    setBillingState((c) => ({ ...c, creating: true, error: '' }));
    try {
      const order = await billingApi.createManualOrder({ credits: 20, amountCents: 9900, currency: 'CNY' });
      setBillingState((c) => ({ ...c, orders: [order, ...c.orders], creating: false }));
    } catch (error) {
      setBillingState((c) => ({ ...c, error: getErrorMessage(error, '订单创建失败，请稍后重试。'), creating: false }));
    }
  };

  const cardClass = isEyeCare ? 'bg-white border border-stone-200' : 'bg-white shadow-sm';

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><CreditCard size={24} /> 我的额度</h2>
      {!isLoggedIn ? (
        <div className="rounded-2xl bg-slate-50 px-4 py-12 text-center text-slate-500"><Lock className="mx-auto mb-2 opacity-50" size={32} />登录后才能查看账号额度。</div>
      ) : billingState.key !== 'loaded' ? (
        <div className="rounded-2xl bg-slate-50 px-4 py-12 text-center text-slate-500"><Clock className="mx-auto mb-2 animate-pulse opacity-50" size={32} />正在加载额度信息...</div>
      ) : billingState.error ? (
        <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-5 text-sm leading-6 text-rose-700">{billingState.error}</div>
      ) : (
        <div className="space-y-4">
          <div className={`p-6 rounded-2xl ${cardClass}`}>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Sparkles size={20} /></div>
                <div><h3 className="font-bold">AI 统一额度</h3><p className="text-xs text-slate-500">搜索、方案生成和导出前的 AI 能力统一扣减</p></div>
              </div>
              <div className="text-3xl font-bold text-blue-600">{billingState.quota?.aiCreditsRemaining ?? 0}<span className="ml-1 text-sm font-medium text-slate-400">点</span></div>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <button onClick={() => navigate('/solution/new')} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700"><Sparkles size={18} /> 生成方案</button>
              <button onClick={() => void createQuotaOrder()} disabled={billingState.creating} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"><CreditCard size={18} /> {billingState.creating ? '正在创建订单' : '创建 20 点手动订单'}</button>
            </div>
          </div>
          <div className={`p-5 rounded-2xl ${cardClass}`}>
            <h3 className="mb-3 font-bold">额度流水</h3>
            {billingState.ledger.length === 0 ? <div className="text-sm text-slate-500">暂无额度变化记录。</div> : (
              <div className="space-y-2">{billingState.ledger.slice(0, 6).map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                  <span className={item.delta >= 0 ? 'font-bold text-emerald-600' : 'font-bold text-rose-600'}>{item.delta >= 0 ? '+' : ''}{item.delta} 点</span>
                  <span className="text-slate-500">{item.reason}</span>
                  <span className="text-xs text-slate-400">{new Date(item.createdAt).toLocaleString('zh-CN')}</span>
                </div>
              ))}</div>
            )}
          </div>
          <div className={`p-5 rounded-2xl ${cardClass}`}>
            <h3 className="mb-3 font-bold">手动订单</h3>
            {billingState.orders.length === 0 ? <div className="text-sm text-slate-500">暂无订单。创建后由后台确认支付并发放额度。</div> : (
              <div className="space-y-2">{billingState.orders.slice(0, 6).map((order) => (
                <div key={order.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                  <span className="font-medium">订单 {order.id}</span>
                  <span className="text-slate-500">{order.credits} 点 · {(order.amountCents / 100).toFixed(2)} {order.currency}</span>
                  <span className={order.status === 'paid' ? 'font-bold text-emerald-600' : 'font-bold text-amber-600'}>{order.status === 'paid' ? '已确认' : '待确认'}</span>
                </div>
              ))}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
