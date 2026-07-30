/**
 * Purge reversível dos produtos que o filtro por substring deixou entrar como selado,
 * mais os produtos que ficaram sem nenhuma variante (a variante foi presa em outro
 * produto pela colisão de fingerprint).
 *
 * Duas fases, nunca uma só:
 *   npx tsx scripts/purge-tcgcsv-false-positives.ts              # dry-run, só relatório
 *   npx tsx scripts/purge-tcgcsv-false-positives.ts --apply      # snapshot + delete em transação
 *
 * O --apply só remove ids que constam do relatório revisado, e grava o snapshot
 * completo das linhas antes de deletar.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createCatalogPgPool } from "../src/product-catalog/persistence/createCatalogPgPool.js";
import { isSealedTcgCsvProduct } from "../src/product-catalog/providers/sealed/TcgCsvSealedProvider.js";

const PROVIDER_ID = "tcgcsv-sealed";
const REPORT_PATH = ".tmp/tcgcsv-purge-report.json";
const RETAINED_PATH = ".tmp/tcgcsv-purge-retained.json";
const SNAPSHOT_PATH = ".tmp/tcgcsv-purge-snapshot.json";

const APPLY = process.argv.includes("--apply");

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

function writeJson(path: string, payload: unknown) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(payload, null, 2));
}

type Candidate = {
  productId: string;
  sku: string | null;
  titlePt: string;
  game: string | null;
  subcategory: string | null;
  variants: number;
  reason: "filter_false_positive" | "orphan_without_variant";
};

loadEnvFile();
const pool = createCatalogPgPool({ max: 1 });

try {
  const { rows } = await pool.query<{
    id: string;
    sku: string | null;
    title_pt: string;
    game: string | null;
    subcategory: string | null;
    variant_count: string;
  }>(
    `
    SELECT p.id, p.sku, p.title_pt, p.game, p.subcategory,
           (SELECT COUNT(*) FROM product_catalog.variants v WHERE v.product_id = p.id) AS variant_count
    FROM product_catalog.products p
    WHERE p.category = 'SEALED_PRODUCT'
      AND EXISTS (
        SELECT 1 FROM product_catalog.provider_mappings pm
        WHERE pm.product_id = p.id AND pm.provider_id = $1
      )
    ORDER BY p.game, p.title_pt
    `,
    [PROVIDER_ID],
  );

  const candidates: Candidate[] = [];
  const retained: Array<{ game: string | null; titlePt: string; subcategory: string | null }> = [];
  for (const row of rows) {
    const variants = Number(row.variant_count);
    if (isSealedTcgCsvProduct(row.title_pt) && variants > 0) {
      retained.push({ game: row.game, titlePt: row.title_pt, subcategory: row.subcategory });
    }
    if (!isSealedTcgCsvProduct(row.title_pt)) {
      candidates.push({
        productId: row.id,
        sku: row.sku,
        titlePt: row.title_pt,
        game: row.game,
        subcategory: row.subcategory,
        variants,
        reason: "filter_false_positive",
      });
      continue;
    }
    if (variants === 0) {
      candidates.push({
        productId: row.id,
        sku: row.sku,
        titlePt: row.title_pt,
        game: row.game,
        subcategory: row.subcategory,
        variants,
        reason: "orphan_without_variant",
      });
    }
  }

  const byGame: Record<string, { falsePositive: number; orphan: number }> = {};
  for (const c of candidates) {
    const key = c.game ?? "UNKNOWN";
    byGame[key] ??= { falsePositive: 0, orphan: 0 };
    if (c.reason === "filter_false_positive") byGame[key].falsePositive++;
    else byGame[key].orphan++;
  }

  const report = {
    generatedAt: new Date().toISOString(),
    providerId: PROVIDER_ID,
    scanned: rows.length,
    candidates: candidates.length,
    falsePositives: candidates.filter((c) => c.reason === "filter_false_positive").length,
    orphans: candidates.filter((c) => c.reason === "orphan_without_variant").length,
    byGame,
    items: candidates,
  };

  if (!APPLY) {
    writeJson(REPORT_PATH, report);
    // O que sobrevive ao filtro precisa ser revisado junto: over-purge é tão ruim quanto under-purge.
    writeJson(RETAINED_PATH, { generatedAt: report.generatedAt, count: retained.length, items: retained });
    console.log(
      JSON.stringify(
        {
          mode: "dry-run",
          report: REPORT_PATH,
          scanned: report.scanned,
          candidates: report.candidates,
          falsePositives: report.falsePositives,
          orphans: report.orphans,
          byGame,
          sample: candidates.slice(0, 15).map((c) => `${c.game}: ${c.titlePt} (${c.reason})`),
        },
        null,
        2,
      ),
    );
    console.error("Nada removido. Revise o relatório e rode de novo com --apply.");
    process.exit(0);
  }

  // --apply só aceita a allowlist do relatório revisado.
  if (!existsSync(REPORT_PATH)) {
    console.error(`Relatório ausente em ${REPORT_PATH}. Rode o dry-run antes do --apply.`);
    process.exit(1);
  }
  const reviewed = JSON.parse(readFileSync(REPORT_PATH, "utf8")) as { items?: Candidate[] };
  const allowlist = new Set((reviewed.items ?? []).map((i) => i.productId));
  const ids = candidates.map((c) => c.productId).filter((id) => allowlist.has(id));
  const skipped = candidates.length - ids.length;

  if (!ids.length) {
    console.log(JSON.stringify({ mode: "apply", deleted: 0, skipped }, null, 2));
    process.exit(0);
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const snapshot = {
      generatedAt: new Date().toISOString(),
      productIds: ids,
      products: (
        await client.query(`SELECT * FROM product_catalog.products WHERE id = ANY($1::uuid[])`, [ids])
      ).rows,
      variants: (
        await client.query(
          `SELECT * FROM product_catalog.variants WHERE product_id = ANY($1::uuid[])`,
          [ids],
        )
      ).rows,
      providerMappings: (
        await client.query(
          `SELECT * FROM product_catalog.provider_mappings WHERE product_id = ANY($1::uuid[])`,
          [ids],
        )
      ).rows,
      productGames: (
        await client.query(
          `SELECT * FROM product_catalog.product_games WHERE product_id = ANY($1::uuid[])`,
          [ids],
        )
      ).rows,
      assetLinks: (
        await client.query(
          `
          SELECT l.* FROM media.asset_links l
          WHERE l.entity_type = 'product_variant'
            AND l.entity_id IN (
              SELECT v.id FROM product_catalog.variants v WHERE v.product_id = ANY($1::uuid[])
            )
          `,
          [ids],
        )
      ).rows,
    };
    writeJson(SNAPSHOT_PATH, snapshot);

    // Assets em media.assets são compartilhados por sha e ficam para um passo separado.
    const links = await client.query(
      `
      DELETE FROM media.asset_links
      WHERE entity_type = 'product_variant'
        AND entity_id IN (
          SELECT v.id FROM product_catalog.variants v WHERE v.product_id = ANY($1::uuid[])
        )
      `,
      [ids],
    );
    const deleted = await client.query(
      `DELETE FROM product_catalog.products WHERE id = ANY($1::uuid[])`,
      [ids],
    );

    await client.query("COMMIT");
    console.log(
      JSON.stringify(
        {
          mode: "apply",
          snapshot: SNAPSHOT_PATH,
          deletedProducts: deleted.rowCount,
          deletedAssetLinks: links.rowCount,
          skippedNotInReport: skipped,
          byGame,
        },
        null,
        2,
      ),
    );
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
} finally {
  await pool.end();
}
