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
    `select schema_name from information_schema.schemata where schema_name in ('checkout','public','platform') order by 1`,
  );
  console.log("schemas:", schemas.rows);

  const tables = await pool.query(
    `select table_schema, table_name from information_schema.tables
     where table_schema = 'checkout' or table_name ilike '%cart%'
     order by 1,2`,
  );
  console.log("tables:", tables.rows);

  try {
    await pool.query(`select 1 from checkout.carts limit 1`);
    console.log("checkout.carts: OK");
  } catch (e) {
    console.log("checkout.carts:", e instanceof Error ? e.message : e);
  }
} finally {
  await pool.end();
}
