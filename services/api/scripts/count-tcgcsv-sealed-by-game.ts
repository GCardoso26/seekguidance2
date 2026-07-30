/**
 * Count sealed products linked to tcgcsv-sealed by game.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createCatalogPgPool } from "../src/product-catalog/persistence/createCatalogPgPool.js";

function loadEnvFile() {
  const p = resolve(process.cwd(), ".env");
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!m) continue;
    if (process.env[m[1]]) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    process.env[m[1]] = v;
  }
}

loadEnvFile();
const pool = createCatalogPgPool({ max: 1 });
try {
  const { rows } = await pool.query(`
    SELECT COALESCE(p.game, 'UNKNOWN') AS game,
           COUNT(DISTINCT p.id) AS products
    FROM product_catalog.provider_mappings pm
    JOIN product_catalog.products p ON p.id = pm.product_id
    WHERE pm.provider_id = 'tcgcsv-sealed'
      AND p.category = 'SEALED_PRODUCT'
    GROUP BY 1
    ORDER BY products DESC
  `);
  console.log(JSON.stringify({ games: rows.length, byGame: rows }, null, 2));
  if (rows.length < 10) process.exitCode = 1;
} finally {
  await pool.end();
}
