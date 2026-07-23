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

const before = await pool.query(
  `select column_name from information_schema.columns
   where table_schema='platform' and table_name='idempotency_keys' order by 1`,
);
console.log("before", before.rows.map((r) => r.column_name));

// Align to governance migration + IdempotentCommandHandler
await pool.query(`DROP TABLE IF EXISTS platform.idempotency_keys CASCADE`);
await pool.query(`
CREATE TABLE platform.idempotency_keys (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  command_name     text NOT NULL,
  idempotency_key  text NOT NULL,
  status           text NOT NULL CHECK (status IN ('processing', 'completed', 'failed')),
  request_hash     text,
  response_hash    text,
  response_body    jsonb,
  error            text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (command_name, idempotency_key)
);
`);

const after = await pool.query(
  `select column_name from information_schema.columns
   where table_schema='platform' and table_name='idempotency_keys' order by 1`,
);
console.log("after", after.rows.map((r) => r.column_name));
await pool.end();
