import fs from "node:fs";
import path from "node:path";
import pg from "pg";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const env: Record<string, string> = {};
for (const line of fs.readFileSync(path.join(root, ".env"), "utf8").split(/\r?\n/)) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("=");
  if (i < 1) continue;
  env[t.slice(0, i)] = t.slice(i + 1).replace(/^["']|["']$/g, "");
}
const url = (env.DATABASE_URL || "").replace(/^postgresql\+asyncpg:/i, "postgresql:");
const pool = new pg.Pool({ connectionString: url });
try {
  const schemas = await pool.query(
    `select table_schema, table_name from information_schema.tables
     where table_name ilike '%listing%' order by 1,2 limit 20`,
  );
  console.log("tables", schemas.rows);
  for (const t of schemas.rows) {
    const q = `select * from ${t.table_schema}.${t.table_name} limit 0`;
    try {
      await pool.query(q);
    } catch {
      /* ignore */
    }
  }
  // try common shapes
  for (const sql of [
    `select id::text, status::text, quantity::int, price_cents::int from marketplace.listings where status='active' and quantity>0 limit 3`,
    `select id::text, status::text from public.listings limit 3`,
  ]) {
    try {
      const r = await pool.query(sql);
      console.log("OK", sql.slice(0, 60), r.rows);
    } catch (e) {
      console.log("ERR", (e as Error).message.split("\n")[0]);
    }
  }
} finally {
  await pool.end();
}
