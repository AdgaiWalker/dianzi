import type { NotificationModuleStatus } from "./types";

export function getNotificationModuleStatus(): NotificationModuleStatus {
  return { module: "notification", ready: true };
}
