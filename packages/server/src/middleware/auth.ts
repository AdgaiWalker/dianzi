import { createMiddleware } from "hono/factory";
import type { Context } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { accounts, users } from "../db/schema";
import { verifyToken, type AuthTokenPayload } from "../lib/auth";
import { resolveSiteContext } from "./site";

declare module "hono" {
  interface ContextVariableMap {
    authUser: AuthTokenPayload;
  }
}

export const authMiddleware = createMiddleware(async (c, next) => {
  const authUser = resolveAuthUser(c);

  if (!authUser) {
    return c.json({ error: "请先登录后再继续操作" }, 401);
  }

  if (await isTokenInvalidated(authUser)) {
    return c.json({ error: "登录状态已失效，请重新登录" }, 401);
  }

  const siteContext = c.get("siteContext") ?? resolveSiteContext(c);
  const tokenSite = authUser.siteContext ?? authUser.site;

  if (siteContext === "all" && authUser.role !== "admin") {
    return c.json({ error: "没有跨站访问权限" }, 401);
  }

  if (tokenSite && siteContext !== "all" && tokenSite !== siteContext) {
    return c.json({ error: "登录状态不属于当前站点，请重新登录" }, 401);
  }

  c.set("authUser", authUser);
  await next();
});

export function resolveAuthUser(c: Context) {
  const header = c.req.header("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length).trim();
  return verifyToken(token);
}

export function requireAuthUser(c: Context) {
  return c.get("authUser");
}

async function isTokenInvalidated(authUser: AuthTokenPayload) {
  if (!db) return false;

  const userId = Number(authUser.sub);
  if (!Number.isInteger(userId)) return false;

  const rows = await db
    .select({
      accountId: users.accountId,
      tokenInvalidBefore: users.tokenInvalidBefore,
      disabledAt: users.disabledAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const user = rows[0];
  if (!user || user.disabledAt) return true;
  const accountId = Number(authUser.accountId ?? user.accountId);
  const accountRows = Number.isInteger(accountId)
    ? await db
        .select({
          tokenInvalidBefore: accounts.tokenInvalidBefore,
          disabledAt: accounts.disabledAt,
        })
        .from(accounts)
        .where(eq(accounts.id, accountId))
        .limit(1)
    : [];
  const account = accountRows[0];
  if (account?.disabledAt) return true;

  const invalidBefore = maxDate(user.tokenInvalidBefore, account?.tokenInvalidBefore ?? null);
  if (!invalidBefore) return false;

  const issuedAt = resolveIssuedAtMs(authUser);
  if (!Number.isFinite(issuedAt)) return true;

  return issuedAt < invalidBefore.getTime();
}

function maxDate(...values: Array<Date | null>) {
  const dates = values.filter((value): value is Date => value instanceof Date);
  if (!dates.length) return null;
  return new Date(Math.max(...dates.map((value) => value.getTime())));
}

function resolveIssuedAtMs(authUser: AuthTokenPayload) {
  const issuedAtMs = Number(authUser.issuedAtMs);
  if (Number.isFinite(issuedAtMs)) return issuedAtMs;

  const issuedAt = Number(authUser.iat);
  return Number.isFinite(issuedAt) ? issuedAt * 1000 : Number.NaN;
}
