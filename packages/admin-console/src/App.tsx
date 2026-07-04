import { useState, type FormEvent } from "react";
import { NavLink, Route, Routes } from "react-router-dom";
import {
  BarChart3,
  Bell,
  CreditCard,
  FileText,
  KeyRound,
  LayoutDashboard,
  LogIn,
  LogOut,
  ScrollText,
  Settings,
  ShieldCheck,
  UserX,
  Users,
} from "lucide-react";
import type { SiteContext } from "@dianzi/shared";
import { readSession, isAdminRole } from "./lib/session";
import { Dashboard } from "./pages/Dashboard";
import { ReviewQueue } from "./pages/ReviewQueue";
import { UsersPage } from "./pages/UsersPage";
import { ContentPage } from "./pages/ContentPage";
import { CompliancePage } from "./pages/CompliancePage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { ReviewDetail } from "./pages/ReviewDetail";
import { FlagsPage } from "./pages/FlagsPage";
import { ContentDetailPage } from "./pages/ContentDetailPage";
import { AuditPage } from "./pages/AuditPage";
import { DeliveryPage } from "./pages/DeliveryPage";
import { ConfigPage } from "./pages/ConfigPage";
import { BillingPage } from "./pages/BillingPage";
import type { AdminSession } from "./types";
import { loginAdmin } from "./services/api";

const navItems = [
  { to: "/", label: "总览", icon: LayoutDashboard },
  { to: "/review", label: "审核队列", icon: ShieldCheck },
  { to: "/users", label: "用户管理", icon: Users },
  { to: "/content", label: "内容管理", icon: FileText },
  { to: "/compliance", label: "合规处理", icon: UserX },
  { to: "/audit", label: "审计日志", icon: ScrollText },
  { to: "/deliveries", label: "通知投递", icon: Bell },
  { to: "/flags", label: "功能开关", icon: Settings },
  { to: "/config", label: "系统配置", icon: Settings },
  { to: "/analytics", label: "数据中心", icon: BarChart3 },
  { to: "/billing", label: "支付管理", icon: CreditCard },
];

const concreteSites: Array<Exclude<SiteContext, "all">> = ["cn", "com"];
export default function App() {
  const [session, setSession] = useState<AdminSession | null>(() => readSession());
  const [site, setSite] = useState<SiteContext>(() => readSession()?.user.site ?? "cn");

  const saveSession = (nextSession: AdminSession) => {
    setSession(nextSession);
    setSite(nextSession.user.site);
    localStorage.setItem("admin_session", JSON.stringify(nextSession));
  };

  const logout = () => {
    setSession(null);
    localStorage.removeItem("admin_session");
  };

  if (!session) {
    return <LoginPage onLogin={saveSession} />;
  }

  const allowedSites: SiteContext[] = session.user.role === "admin" ? ["cn", "com", "all"] : [session.user.site];
  const effectiveSite = allowedSites.includes(site) ? site : session.user.site;

  return (
    <div className="min-h-screen bg-paper text-ink">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-line bg-white px-4 py-5 lg:block">
        <div className="mb-8 flex items-center gap-3 px-2">
          <ShieldCheck className="h-7 w-7 text-teal" aria-hidden="true" />
          <div>
            <div className="text-base font-semibold">盘根统一后台</div>
            <div className="text-xs text-neutral-500">admin-console</div>
          </div>
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
            >
              <item.icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-line bg-white/95 px-4 py-3 backdrop-blur md:px-6">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-neutral-600">当前站点</span>
              <div className="segmented">
                {allowedSites.map((item) => (
                  <button
                    key={item}
                    className={item === effectiveSite ? "segmented-active" : "segmented-button"}
                    type="button"
                    onClick={() => setSite(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="user-chip">
                <KeyRound className="h-4 w-4 text-teal" aria-hidden="true" />
                {session.user.name} · {session.user.role}
              </span>
              <button className="ghost-button" type="button" onClick={logout}>
                <LogOut className="h-4 w-4" aria-hidden="true" />
                退出
              </button>
            </div>
          </div>
          <nav className="mt-3 flex gap-2 overflow-x-auto lg:hidden">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) => (isActive ? "mobile-nav-link active" : "mobile-nav-link")}
              >
                <item.icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </header>

        <main className="px-4 py-6 md:px-6">
          <Routes>
            <Route path="/" element={<Dashboard site={effectiveSite} token={session.token} />} />
            <Route path="/review" element={<ReviewQueue site={effectiveSite} token={session.token} />} />
            <Route path="/review/:id" element={<ReviewDetail site={effectiveSite} token={session.token} />} />
            <Route path="/users" element={<UsersPage site={effectiveSite} token={session.token} currentUser={session.user} />} />
            <Route path="/content" element={<ContentPage site={effectiveSite} token={session.token} />} />
            <Route path="/content/:id" element={<ContentDetailPage site={effectiveSite} token={session.token} />} />
            <Route path="/compliance" element={<CompliancePage site={effectiveSite} token={session.token} />} />
            <Route path="/flags" element={<FlagsPage site={effectiveSite} token={session.token} />} />
            <Route path="/audit" element={<AuditPage site={effectiveSite} token={session.token} />} />
            <Route path="/deliveries" element={<DeliveryPage site={effectiveSite} token={session.token} />} />
            <Route path="/config" element={<ConfigPage site={effectiveSite} token={session.token} />} />
            <Route path="/analytics" element={<AnalyticsPage site={effectiveSite} token={session.token} />} />
            <Route path="/billing" element={<BillingPage site={effectiveSite} token={session.token} />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function LoginPage({ onLogin }: { onLogin: (session: AdminSession) => void }) {
  const [site, setSite] = useState<Exclude<SiteContext, "all">>("cn");
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const session = await loginAdmin(account, password, site);
      if (!isAdminRole(session.user.role)) {
        setError("当前账号没有后台访问权限");
        return;
      }
      onLogin(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-paper px-4 py-8 text-ink">
      <form className="login-panel" onSubmit={submit}>
        <div className="mb-6 flex items-center gap-3">
          <ShieldCheck className="h-8 w-8 text-teal" aria-hidden="true" />
          <div>
            <h1 className="text-xl font-semibold">盘根统一后台</h1>
            <p className="mt-1 text-sm text-neutral-500">使用用户名或邮箱登录</p>
          </div>
        </div>

        <label className="field-label">
          站点
          <div className="segmented mt-2">
            {concreteSites.map((item) => (
              <button
                key={item}
                className={item === site ? "segmented-active" : "segmented-button"}
                type="button"
                onClick={() => setSite(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </label>

        <label className="field-label">
          用户名或邮箱
          <input className="text-input" value={account} onChange={(event) => setAccount(event.target.value)} />
        </label>

        <label className="field-label">
          密码
          <input className="text-input" value={password} type="password" onChange={(event) => setPassword(event.target.value)} />
        </label>

        {error && <div className="error-line">{error}</div>}

        <button className="primary-button w-full" type="submit" disabled={loading}>
          <LogIn className="h-4 w-4" aria-hidden="true" />
          {loading ? "正在登录" : "登录后台"}
        </button>
      </form>
    </main>
  );
}
