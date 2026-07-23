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

async function q(label: string, sql: string) {
  try {
    const r = await pool.query(sql);
    console.log(label, JSON.stringify(r.rows, null, 2));
  } catch (e) {
    console.log(label, "ERR", String((e as Error).message).split("\n")[0]);
  }
}

await q(
  "schemas",
  `select schema_name from information_schema.schemata
   where schema_name in ('marketplace','checkout','identity','platform','tcg_judge')
   order by 1`,
);
await q(
  "tables",
  `select table_schema, table_name from information_schema.tables
   where table_schema in ('marketplace','checkout','identity','platform')
   order by 1,2`,
);
await q(
  "card_listings_active",
  `select count(*)::int as n,
          count(*) filter (where status='active')::int as active,
          coalesce(sum(quantity) filter (where status='active' and quantity>0),0)::int as qty_sum
   from tcg_judge.card_listings`,
);
await q(
  "card_listings_sample",
  `select id::text, status, quantity, price_cents
   from tcg_judge.card_listings
   where status='active' and quantity>0
   limit 5`,
);
await q(
  "marketplace_listings",
  `select count(*)::int as n,
          count(*) filter (where status='active' and quantity>0)::int as sellable
   from marketplace.listings`,
);

await pool.end();
