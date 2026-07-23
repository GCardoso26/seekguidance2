import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { Pool } from "pg";
import { getIdGenerator } from "../../shared/ids/IdGenerator.js";
import { ProductCatalogSyncService } from "../application/ProductCatalogSyncService.js";
import { PostgresProductCatalogRepository } from "../persistence/PostgresProductCatalogRepository.js";
import { GamegenicSleevesProvider } from "../manufacturers/gamegenic/provider.js";

function loadEnv() {
  const p = resolve(process.cwd(), ".env");
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!m || process.env[m[1]]) continue;
    let v = m[2].trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    process.env[m[1]] = v;
  }
}

async function main() {
  loadEnv();
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("DATABASE_URL required");
  const pool = new Pool({
    connectionString: raw.replace(/^postgresql\+asyncpg:/, "postgresql:"),
  });
  try {
    const sync = new ProductCatalogSyncService(new PostgresProductCatalogRepository(pool), pool);
    const r = await sync.runJob("catalog.sync.sleeves", [new GamegenicSleevesProvider()], {
      mode: "full",
      requestId: getIdGenerator().generate(),
      dryRun: false,
    });
    const counts = await pool.query(`
      SELECT
        (SELECT count(*)::int FROM product_catalog.official_product_contents) AS contents,
        (SELECT count(*)::int FROM product_catalog.product_specifications) AS specs,
        (SELECT count(*)::int FROM product_catalog.product_official_metadata) AS metadata
    `);
    console.log(
      JSON.stringify({
        upserted: r.upserted,
        ok: r.ok,
        ...counts.rows[0],
        errors: r.errors.slice(0, 5),
      }),
    );
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
