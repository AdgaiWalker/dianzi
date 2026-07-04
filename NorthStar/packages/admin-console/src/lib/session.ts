import type { IdentityUser } from "@ns/shared";
import { isGlobalLevel } from "@ns/shared";
import type { AdminSession } from "../types";

export function readSession(): AdminSession | null {
  const raw = localStorage.getItem("admin_session");
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as AdminSession;
    return parsed?.token && isIdentityUser(parsed.user) && isAdminRole(parsed.user.role) ? parsed : null;
  } catch {
    return null;
  }
}

export function isIdentityUser(value: unknown): value is IdentityUser {
  if (!value || typeof value !== "object") return false;
  const user = value as Partial<IdentityUser>;
  return (
    typeof user.id === "string" &&
    typeof user.accountId === "string" &&
    typeof user.profileId === "string" &&
    typeof user.username === "string" &&
    typeof user.email === "string" &&
    typeof user.name === "string" &&
    (user.site === "cn" || user.site === "com") &&
    isAdminRole(user.role) &&
    isGlobalLevel(user.globalLevel) &&
    typeof user.emailVerified === "boolean"
  );
}

export function isAdminRole(role: unknown): role is "reviewer" | "operator" | "admin" {
  return role === "reviewer" || role === "operator" || role === "admin";
}
