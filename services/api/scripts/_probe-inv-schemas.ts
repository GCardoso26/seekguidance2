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
const pool = new pg.Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });

const r = await pool.query(
  `select schema_name from information_schema.schemata
   where schema_name in ('inventory','pricing','orders','order','reservation','marketplace','identity')
   order by 1`,
);
console.log("schemas", r.rows);

const t = await pool.query(
  `select table_schema, table_name from information_schema.tables
   where (table_schema = 'inventory')
      or (table_schema = 'platform' and table_name in ('sagas','saga_steps','outbox_events','domain_events'))
      or (table_schema = 'pricing' and table_name ilike '%quote%')
   order by 1,2`,
);
console.log("tables", t.rows);

await pool.end();
