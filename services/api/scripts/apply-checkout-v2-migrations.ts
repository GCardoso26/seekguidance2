import fs from "node:fs";
import path from "node:path";
import pg from "pg";
import { fileURLToPath } from "node:url";

const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(apiRoot, "../..");

const env: Record<string, string> = {};
for (const line of fs.readFileSync(path.join(apiRoot, ".env"), "utf8").split(/\r?\n/)) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("=");
  if (i < 1) continue;
  env[t.slice(0, i)] = t.slice(i + 1).replace(/^["']|["']$/g, "");
}

const url = (env.DATABASE_URL || "").replace(/^postgresql\+asyncpg:/i, "postgresql:");
const pool = new pg.Pool({ connectionString: url });

const files = [
  "supabase/migrations/20260720200000_checkout_bc.sql",
  "supabase/migrations/20260720210000_checkout_sprint1_cart_coupon.sql",
  "supabase/migrations/20260720230000_checkout_expired_pix.sql",
  "supabase/migrations/20260723130000_platform_outbox.sql",
];

try {
  for (const f of files) {
    const p = path.join(repoRoot, f);
    if (!fs.existsSync(p)) {
      console.log("SKIP missing", f);
      continue;
    }
    const sql = fs.readFileSync(p, "utf8");
    process.stdout.write(`APPLY ${f} ... `);
    try {
      await pool.query(sql);
      console.log("OK");
    } catch (e) {
      console.log("ERR", e instanceof Error ? e.message.split("\n")[0] : e);
    }
  }

  // idempotency table if missing (must match IdempotentCommandHandler)
  await pool.query(`
    CREATE SCHEMA IF NOT EXISTS platform;
    CREATE TABLE IF NOT EXISTS platform.idempotency_keys (
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
  console.log("ENSURE platform.idempotency_keys OK");

  const r = await pool.query(`
    select
      to_regclass('checkout.carts') as carts,
      to_regclass('checkout.sessions') as sessions,
      to_regclass('platform.outbox_events') as outbox,
      to_regclass('platform.idempotency_keys') as idem
  `);
  console.log("regclass:", r.rows[0]);
} finally {
  await pool.end();
}
