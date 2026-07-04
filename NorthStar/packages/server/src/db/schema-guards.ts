import { pool } from "./client";

let searchLogsSiteReady: Promise<void> | null = null;

export async function ensureSearchLogsSiteColumn() {
  if (!pool) return;

  searchLogsSiteReady ??= (async () => {
    await pool.query(`alter table search_logs add column if not exists site varchar(10) not null default 'cn'`);
    await pool.query(`create index if not exists search_log_site_idx on search_logs (site)`);
  })();

  await searchLogsSiteReady;
}
