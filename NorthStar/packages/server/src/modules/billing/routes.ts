import { Hono } from "hono";
import type { Context } from "hono";
import type { CreatePaymentOrderRequest } from "@ns/shared";
import { fail, ok, readJson, sendResult } from '../../lib/http';
import { authMiddleware, requireAuthUser } from "../../middleware/auth";
import { requireSiteContext } from "../../middleware/site";
import {
  confirmManualPaymentOrder,
  getBillingModuleStatus,
  readAdminBillingOverview,
  readMyPaymentOrders,
  readMyQuota,
  submitPaymentOrder,
} from "./service";

export const billingRoute = new Hono();

billingRoute.get("/api/billing/health", (c) => ok(c, getBillingModuleStatus()));

billingRoute.use("/api/billing/*", authMiddleware);

billingRoute.get("/api/billing/quota", async (c) => sendResult(c, await readMyQuota(requireSiteContext(c), requireAuthUser(c))));

billingRoute.get("/api/billing/admin/overview", async (c) =>
  sendResult(c, await readAdminBillingOverview(requireSiteContext(c), requireAuthUser(c))),
);

billingRoute.get("/api/billing/orders", async (c) =>
  sendResult(c, await readMyPaymentOrders(requireSiteContext(c), requireAuthUser(c))),
);

billingRoute.post("/api/billing/orders", async (c) =>
  sendResult(c, await submitPaymentOrder(requireSiteContext(c), requireAuthUser(c), await readJson<CreatePaymentOrderRequest>(c)), 201),
);

billingRoute.post("/api/billing/admin/orders/:id/confirm", async (c) => {
  const id = Number(c.req.param("id"));
  return sendResult(c, await confirmManualPaymentOrder(requireSiteContext(c), requireAuthUser(c), id));
});


