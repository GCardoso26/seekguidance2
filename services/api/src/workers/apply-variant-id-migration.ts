import pg from "pg";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const client = await pool.connect();
  try {
    const tables = await client.query(`
      SELECT table_schema, table_name FROM information_schema.tables
      WHERE table_schema='marketplace' AND table_name IN ('inventory_items','listings')
    `);
    console.log(JSON.stringify({ marketplace_tables: tables.rows }));

    const before = await client.query(`
      SELECT table_name, column_name, data_type
      FROM information_schema.columns
      WHERE table_schema='marketplace'
        AND column_name='catalog_variant_id'
      ORDER BY table_name
    `);
    console.log(JSON.stringify({ variant_col_before: before.rows }));

    if (tables.rows.length < 2) {
      console.error("marketplace_tables_missing — apply domain migrations first");
      process.exit(2);
    }

    const sqlPath = join(
      __dirname,
      "../../../../supabase/migrations/20260724130000_marketplace_variant_id_text.sql",
    );
    const sql = readFileSync(sqlPath, "utf8");
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("COMMIT");

    const after = await client.query(`
      SELECT table_name, column_name, data_type
      FROM information_schema.columns
      WHERE table_schema='marketplace'
        AND column_name='catalog_variant_id'
      ORDER BY table_name
    `);
    console.log(JSON.stringify({ variant_col_after: after.rows, migration: "applied" }));
  } catch (e) {
    try {
      await client.query("ROLLBACK");
    } catch {
      /* ignore */
    }
    console.error(e);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
