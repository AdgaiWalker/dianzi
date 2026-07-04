import { useCallback, useState } from "react";
import { Ban, CheckCircle2 } from "lucide-react";
import type { AdminUserRecord, IdentityUser, PlatformRole } from "@ns/shared";
import { DataState } from "../components/DataState";
import { PageShell } from "../components/PageShell";
import { Pagination } from "../components/Pagination";
import { useApiResource } from "../components/useApiResource";
import { getAdminUsers, updateAdminUserRole, updateAdminUserStatus } from "../services/api";
import type { PageProps } from "../types";

const roles: Array<Exclude<PlatformRole, "visitor">> = ["user", "editor", "reviewer", "operator", "admin"];

export function UsersPage({ site, token, currentUser }: PageProps & { currentUser: IdentityUser }) {
  const [message, setMessage] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const load = useCallback(() => getAdminUsers(site, token), [site, token]);
  const resource = useApiResource(load);
  const items = resource.data?.items ?? [];

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = items.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const changeRole = async (user: AdminUserRecord, role: Exclude<PlatformRole, "visitor">) => {
    setMessage(null);
    try {
      await updateAdminUserRole(site, token, user.id, { role });
      setMessage("用户角色已更新");
      resource.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "用户角色更新失败");
    }
  };

  const toggleUserStatus = async (user: AdminUserRecord) => {
    setMessage(null);
    try {
      await updateAdminUserStatus(site, token, user.id, { disabled: !user.disabled });
      setMessage(user.disabled ? "用户已启用" : "用户已禁用");
      resource.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "用户状态更新失败");
    }
  };

  return (
    <PageShell title="用户管理">
      {message && <div className="notice-line">{message}</div>}
      <DataState loading={resource.loading} error={resource.error} empty={items.length === 0} emptyText="暂无用户" onRetry={resource.refresh}>
        <div className="table-list">
          {paged.map((item) => (
            <div className="table-row" key={item.id}>
              <div>
                <div className="font-medium">{item.name || item.username}</div>
                <div className="text-sm text-neutral-500">
                  {item.username} · {item.email || "无邮箱"} · {item.site}
                  <span className={`ml-2 inline-block rounded px-1.5 py-0.5 text-xs font-medium ${item.disabled ? "bg-rose-50 text-rose-700" : "bg-green-50 text-green-700"}`}>
                    {item.disabled ? "已禁用" : "正常"}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <select
                  className="select-input w-36"
                  value={item.role}
                  disabled={currentUser.role !== "admin"}
                  onChange={(event) => changeRole(item, event.target.value as Exclude<PlatformRole, "visitor">)}
                >
                  {roles.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
                <button
                  className={item.disabled ? "ghost-button" : "danger-button"}
                  type="button"
                  disabled={currentUser.role !== "admin"}
                  onClick={() => void toggleUserStatus(item)}
                >
                  {item.disabled ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : <Ban className="h-4 w-4" aria-hidden="true" />}
                  {item.disabled ? "启用" : "禁用"}
                </button>
              </div>
            </div>
          ))}
        </div>
        <Pagination page={currentPage} total={items.length} pageSize={pageSize} onChange={setPage} />
      </DataState>
    </PageShell>
  );
}
