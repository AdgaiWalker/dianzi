import { createMiddleware } from "hono/factory";
import type { Context } from "hono";
import { isSiteContext, type SiteContext } from "@dianzi/shared";

declare module "hono" {
  interface ContextVariableMap {
    siteContext: SiteContext;
    productContext: "campus" | "compass" | null;
  }
}

export const siteMiddleware = createMiddleware(async (c, next) => {
  c.set("siteContext", resolveSiteContext(c));
  c.set("productContext", resolveProductContext(c));
  await next();
});

export function resolveSiteContext(c: Context): SiteContext {
  // LOCK_SITE=1 时服务端环境变量优先，防止客户端伪造（生产部署使用）
  if (process.env.LOCK_SITE === "1") {
    const envSite = process.env.SITE;
    if (envSite && isSiteContext(envSite)) return envSite;
  }

  const querySite = c.req.query("site");
  const raw =
    c.req.header("x-pangen-site") ??
    c.req.header("x-pangen-data-site") ??
    (querySite && isSiteContext(querySite) ? querySite : undefined) ??
    process.env.SITE ??
    "cn";
  return isSiteContext(raw) ? raw : "cn";
}

export function resolveProductContext(c: Context): "campus" | "compass" | null {
  const raw = c.req.query("site") ?? c.req.header("x-pangen-product-site");
  if (raw === "campus" || raw === "compass") return raw;
  return null;
}

export function requireSiteContext(c: Context): SiteContext {
  return c.get("siteContext") ?? resolveSiteContext(c);
}

export function toDataSite(site: SiteContext) {
  return site === "all" ? null : site;
}
