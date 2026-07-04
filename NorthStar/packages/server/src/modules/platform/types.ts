import type {
  AdminContentRecord,
  AdminSummary,
  AdminUserRecord,
  AuditLogRecord,
  SiteConfigRecord,
  SiteContext,
  UpdateAdminUserRoleRequest,
  UpdateAdminUserStatusRequest,
  UpdateSiteConfigRequest,
} from "@ns/shared";

export type {
  AdminContentRecord,
  AdminSummary,
  AdminUserRecord,
  AuditLogRecord,
  SiteConfigRecord,
  SiteContext,
  UpdateAdminUserRoleRequest,
  UpdateAdminUserStatusRequest,
  UpdateSiteConfigRequest,
};

export interface CreateAuditLogInput {
  actorId: number | null;
  site: SiteContext;
  targetType: string;
  targetId: string;
  action: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
}
