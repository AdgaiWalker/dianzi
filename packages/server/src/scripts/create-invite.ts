import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { inviteCodes } from "../db/schema.js";

const connectionString = process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/northstar";
const code = process.env.INVITE_CODE ?? `INVITE-${Date.now()}`;
const site = (process.env.INVITE_SITE ?? "com") as "com" | "cn";
const maxUses = Number(process.env.INVITE_MAX_USES ?? 100);

const pool = new pg.Pool({ connectionString });
const db = drizzle(pool);

async function main() {
  const [row] = await db.insert(inviteCodes).values({
    code,
    site,
    maxUses,
    usedCount: 0,
    expiresAt: new Date("2027-12-31"),
    createdBy: null,
  }).returning();
  console.log("Invite code created:", row);
  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
