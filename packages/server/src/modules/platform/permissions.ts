import type { PlatformRole } from "@dianzi/shared";

const ROLE_HIERARCHY: PlatformRole[] = ["visitor", "user", "editor", "reviewer", "operator", "admin"];

function roleIndex(role: PlatformRole): number {
  return ROLE_HIERARCHY.indexOf(role);
}

/** 是否至少是 reviewer 级别（reviewer / operator / admin） */
export function isAtLeastReviewer(role: PlatformRole): boolean {
  return roleIndex(role) >= roleIndex("reviewer");
}

/** 是否至少是 operator 级别（operator / admin） */
export function isAtLeastOperator(role: PlatformRole): boolean {
  return roleIndex(role) >= roleIndex("operator");
}

/** 是否是 admin */
export function isAdmin(role: PlatformRole): boolean {
  return role === "admin";
}

/** 是否至少是 editor 级别（editor / reviewer / operator / admin） */
export function isAtLeastEditor(role: PlatformRole): boolean {
  return roleIndex(role) >= roleIndex("editor");
}
