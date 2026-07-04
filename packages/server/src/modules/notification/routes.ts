import { Hono } from "hono";
import type { Context } from "hono";
import { fail, ok, readJson, sendResult } from '../../lib/http';
import { authMiddleware, requireAuthUser } from "../../middleware/auth";
import { getNotificationModuleStatus, markUserNotificationRead, readUserNotifications } from "./service";
import { listDevDeliveryLog } from "./email-provider";

export const notificationRoute = new Hono();

notificationRoute.get("/api/notification/health", (c) => ok(c, getNotificationModuleStatus()));

notificationRoute.get("/api/notification/inbox", authMiddleware, async (c) => {
  const result = await readUserNotifications(requireAuthUser(c));
  return sendResult(c, result);
});

notificationRoute.post("/api/notification/:id/read", authMiddleware, async (c) => {
  const result = await markUserNotificationRead(requireAuthUser(c), c.req.param("id"));
  return sendResult(c, result);
});

notificationRoute.get("/api/notification/email-deliveries", authMiddleware, async (c) => {
  const actor = requireAuthUser(c);
  if (actor.role !== "admin" && actor.role !== "operator") {
    return fail(c, 403, "EMAIL_DELIVERY_FORBIDDEN", "没有查看邮件投递记录的权限");
  }
  return ok(c, { deliveries: listDevDeliveryLog() });
});

