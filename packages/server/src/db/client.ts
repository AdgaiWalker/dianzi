import { config } from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

config();

export const site = process.env.SITE === "com" ? "com" : "cn";

export const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) console.error("[DB] DATABASE_URL is not set — database unavailable");

export const pool = databaseUrl
  ? new pg.Pool({
      connectionString: databaseUrl,
      ssl: databaseUrl.includes("supabase") ? { rejectUnauthorized: false } : undefined,
    })
  : null;

export const db = pool ? drizzle(pool, { schema }) : null;

if (pool) {
  pool.query("SELECT 1 AS ok").then(() => {
    console.log("[DB] Connection test: OK");
  }).catch((err: Error) => {
    console.error("[DB] Connection test FAILED:", err.message);
  });
} else {
  console.error("[DB] No pool created — DATABASE_URL is missing");
}
