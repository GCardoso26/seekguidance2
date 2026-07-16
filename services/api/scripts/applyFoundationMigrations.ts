import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Pool } from "pg";

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL ?? process.env.CONTRACT_DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL required");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: url });
  const cmd = process.argv[2] ?? "inspect";

  try {
    if (cmd === "inspect") {
      const schemas = await pool.query(
        `SELECT nspname FROM pg_namespace
         WHERE nspname NOT LIKE 'pg_%' AND nspname <> 'information_schema'
         ORDER BY 1`,
      );
      console.log("schemas:", schemas.rows.map((r) => r.nspname).join(", ") || "(none)");
      const tables = await pool.query(
        `SELECT table_schema, table_name FROM information_schema.tables
         WHERE table_schema IN ('catalog','platform','identity','marketplace','cart','order','reservation','public')
         ORDER BY 1,2`,
      );
      console.log("tables:", tables.rows.map((r) => `${r.table_schema}.${r.table_name}`).join(", ") || "(none)");
      return;
    }

    if (cmd === "migrate") {
      const root = resolve(process.cwd(), "../../supabase/migrations");
      const files = [
        "20260723120000_domain_schemas_phase1.sql",
        "20260723130000_platform_outbox.sql",
        "20260723140000_guardrails_version_outbox_timeline.sql",
        "20260724120000_identity_marketplace_domain.sql",
        "20260725120000_order_domain.sql",
        "20260725130000_reservation_engine.sql",
        "20260725140000_payment_domain.sql",
      ];
      for (const file of files) {
        const path = resolve(root, file);
        const sql = readFileSync(path, "utf8");
        console.log("applying", file);
        await pool.query(sql);
        console.log("ok", file);
      }
      return;
    }

    console.error("usage: inspect | migrate");
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
