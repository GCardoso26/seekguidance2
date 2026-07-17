/**
 * Day-0 smoke: Rapunzel in Catalog (+ optional Search rebuild from Catalog).
 * Usage: DATABASE_URL=... npx tsx src/workers/smoke-rapunzel.ts
 */
import pg from "pg";
import { createServer } from "node:http";
import { InMemorySearchProjectionRepository } from "../search/persistence/InMemorySearchProjectionRepository.js";
import { ProjectionSearchQueryService } from "../search/application/ProjectionSearchQueryService.js";
import { createPublicReadServer } from "../public-api/http/createPublicReadServer.js";
import type { SearchCardDocument } from "../search/domain/SearchDocument.js";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const cards = await pool.query(
    `
    SELECT c.id, c.name, c.normalized_name, s.code AS set_code, g.code AS game_code
    FROM catalog.catalog_cards c
    JOIN catalog.catalog_sets s ON s.id = c.set_id
    JOIN catalog.catalog_games g ON g.id = c.game_id
    WHERE g.code = 'LORCANA'
      AND (c.name ILIKE '%Rapunzel%' OR c.normalized_name ILIKE '%rapunzel%')
    `,
  );
  console.log(JSON.stringify({ catalog_rapunzel: cards.rows }, null, 2));
  if (cards.rows.length === 0) {
    console.error("SMOKE_FAIL catalog_missing_rapunzel");
    process.exit(2);
  }

  const all = await pool.query(
    `
    SELECT c.id, c.name, c.normalized_name, c.oracle_text, c.rarity, c.language,
           s.code AS set_code, s.name AS set_name,
           COALESCE(
             (SELECT array_agg(DISTINCT v.finish) FROM catalog.catalog_variants v WHERE v.card_id = c.id),
             ARRAY[]::text[]
           ) AS finishes
    FROM catalog.catalog_cards c
    JOIN catalog.catalog_sets s ON s.id = c.set_id
    JOIN catalog.catalog_games g ON g.id = c.game_id
    WHERE g.code = 'LORCANA'
    `,
  );

  const projection = new InMemorySearchProjectionRepository();
  for (const row of all.rows) {
    const doc: SearchCardDocument = {
      id: String(row.id),
      name: String(row.name),
      nameNormalized: String(row.normalized_name ?? row.name).toLowerCase(),
      oracleText: row.oracle_text ? String(row.oracle_text) : null,
      setCode: String(row.set_code).toUpperCase(),
      setName: row.set_name ? String(row.set_name) : null,
      language: String(row.language ?? "en"),
      rarity: row.rarity ? String(row.rarity) : null,
      finishes: Array.isArray(row.finishes) ? row.finishes.map(String) : [],
      imageUrl: null,
      priceMin: null,
      priceMax: null,
      currency: null,
      storeIds: [],
      stockTotal: 0,
      hasStock: false,
      projection: "day0-smoke",
      updatedAt: new Date().toISOString(),
    };
    await projection.upsert(doc);
  }

  const queries = new ProjectionSearchQueryService(projection);
  const result = await queries.search({ q: "Rapunzel", limit: 5 });
  const hit = result.hits.find((h) => /rapunzel/i.test(h.document.name));
  console.log(
    JSON.stringify(
      {
        search_q: "Rapunzel",
        estimatedTotal: result.estimatedTotal,
        hit: hit
          ? {
              id: hit.document.id,
              name: hit.document.name,
              setCode: hit.document.setCode,
              finishes: hit.document.finishes,
            }
          : null,
      },
      null,
      2,
    ),
  );

  if (!hit) {
    console.error("SMOKE_FAIL search_missing_rapunzel");
    process.exit(3);
  }

  // HTTP smoke on ephemeral port
  const server = createPublicReadServer({ queries, projection });
  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });
  const addr = server.address();
  const port = typeof addr === "object" && addr ? addr.port : 0;
  const res = await fetch(`http://127.0.0.1:${port}/api/v1/search?q=${encodeURIComponent("Rapunzel")}&limit=5`);
  const body = (await res.json()) as { hits?: Array<{ card: { name: string } }> };
  console.log(JSON.stringify({ http_status: res.status, http_hit: body.hits?.[0]?.card?.name ?? null }, null, 2));
  server.close();
  await pool.end();

  if (res.status !== 200 || !body.hits?.some((h) => /rapunzel/i.test(h.card.name))) {
    console.error("SMOKE_FAIL http_search");
    process.exit(4);
  }
  console.log("SMOKE_OK rapunzel");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
