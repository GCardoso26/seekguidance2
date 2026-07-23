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
const raw = env.DATABASE_URL || "";
const url = raw.replace(/^postgresql\+asyncpg:/i, "postgresql:");
const u = new URL(url.replace(/^postgresql:/, "http:"));
console.log("db_host", u.hostname, "db", u.pathname);

const pool = new pg.Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });
const cols = await pool.query(
  `select column_name, data_type, is_nullable
   from information_schema.columns
   where table_schema='marketplace' and table_name='listings'
   order by ordinal_position`,
);
console.log("columns", cols.rows.map((r) => r.column_name));

// harden columns
for (const sql of [
  `ALTER TABLE marketplace.listings ADD COLUMN IF NOT EXISTS subject_type text NOT NULL DEFAULT 'catalog_variant'`,
  `ALTER TABLE marketplace.listings ADD COLUMN IF NOT EXISTS product_variant_id uuid`,
  `ALTER TABLE marketplace.listings ADD COLUMN IF NOT EXISTS inventory_stock_unit_id uuid`,
  `ALTER TABLE marketplace.listings ADD COLUMN IF NOT EXISTS published_at timestamptz`,
]) {
  await pool.query(sql);
  console.log("ok", sql.slice(0, 70));
}

const cols2 = await pool.query(
  `select column_name from information_schema.columns
   where table_schema='marketplace' and table_name='listings' order by 1`,
);
console.log("columns_after", cols2.rows.map((r) => r.column_name));

const sample = await pool.query(
  `SELECT id, subject_type, inventory_stock_unit_id, quantity, status
   FROM marketplace.listings WHERE status='active' LIMIT 3`,
);
console.log("sample", sample.rows);

await pool.end();
