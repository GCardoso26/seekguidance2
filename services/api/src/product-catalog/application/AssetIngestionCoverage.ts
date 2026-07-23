import type { Pool, PoolClient } from "pg";

type Q = Pool | PoolClient;

export interface AssetIngestionCoverageReport {
  accessories: { total: number; withImage: number; coveragePct: number };
  sealed: { total: number; withImage: number; coveragePct: number };
  productsWithoutImage: number;
  byManufacturer: Array<{ name: string; total: number; withImage: number; coveragePct: number }>;
  byPublisher: Array<{ name: string; total: number; withImage: number; coveragePct: number }>;
  byGame: Array<{ code: string; total: number; withImage: number; coveragePct: number }>;
  byExpansion: Array<{ name: string; total: number; withImage: number; coveragePct: number }>;
  byCategory: Array<{ category: string; total: number; withImage: number; coveragePct: number }>;
  duplicateAssets: number;
  orphanAssets: number;
  averageImageQuality: number;
  averageAssetScore: number;
  topManufacturers: Array<{ name: string; total: number; withImage: number; coveragePct: number }>;
  topPublishers: Array<{ name: string; total: number; withImage: number; coveragePct: number }>;
  assetsReplaced: number;
  assetsUpdated: number;
  coverageHistory: Array<{ day: string; productsWithImage: number; productsTotal: number }>;
  generatedAt: string;
}

function pct(withImage: number, total: number): number {
  if (!total) return 0;
  return Math.round((withImage / total) * 1000) / 10;
}

/**
 * Coverage analytics for official image ingestion — Product Catalog schema only + media via existing tables.
 * No new BC; read-only aggregates for ops/admin.
 */
export async function computeAssetIngestionCoverage(db: Q): Promise<AssetIngestionCoverageReport> {
  const hasImageSql = `
    EXISTS (
      SELECT 1 FROM product_catalog.variants v
      JOIN media.asset_links l ON l.entity_id = v.id AND l.entity_type = 'product_variant'
      WHERE v.product_id = p.id
    )
  `;

  const domain = await db.query<{ domain: string; total: string; with_image: string }>(
    `
    SELECT
      CASE WHEN p.category = 'SEALED_PRODUCT' THEN 'sealed' ELSE 'accessories' END AS domain,
      count(*)::text AS total,
      count(*) FILTER (WHERE ${hasImageSql})::text AS with_image
    FROM product_catalog.products p
    GROUP BY 1
    `,
  );

  const accessories = { total: 0, withImage: 0, coveragePct: 0 };
  const sealed = { total: 0, withImage: 0, coveragePct: 0 };
  for (const row of domain.rows) {
    const bucket = row.domain === "sealed" ? sealed : accessories;
    bucket.total = Number(row.total);
    bucket.withImage = Number(row.with_image);
    bucket.coveragePct = pct(bucket.withImage, bucket.total);
  }

  const without = await db.query<{ c: string }>(
    `SELECT count(*)::text AS c FROM product_catalog.products p WHERE NOT (${hasImageSql})`,
  );

  const byCategory = await db.query<{ category: string; total: string; with_image: string }>(
    `
    SELECT p.category, count(*)::text AS total,
           count(*) FILTER (WHERE ${hasImageSql})::text AS with_image
    FROM product_catalog.products p
    GROUP BY p.category
    ORDER BY count(*) DESC
    `,
  );

  const byManufacturer = await db.query<{ name: string; total: string; with_image: string }>(
    `
    SELECT coalesce(m.name, 'unknown') AS name, count(p.id)::text AS total,
           count(p.id) FILTER (WHERE ${hasImageSql})::text AS with_image
    FROM product_catalog.products p
    LEFT JOIN product_catalog.manufacturers m ON m.id = p.manufacturer_id
    WHERE p.category <> 'SEALED_PRODUCT'
    GROUP BY 1
    ORDER BY count(p.id) DESC
    LIMIT 50
    `,
  );

  const byPublisher = await db.query<{ name: string; total: string; with_image: string }>(
    `
    SELECT coalesce(m.name, 'unknown') AS name, count(p.id)::text AS total,
           count(p.id) FILTER (WHERE ${hasImageSql})::text AS with_image
    FROM product_catalog.products p
    LEFT JOIN product_catalog.manufacturers m ON m.id = p.manufacturer_id
    WHERE p.category = 'SEALED_PRODUCT'
    GROUP BY 1
    ORDER BY count(p.id) DESC
    LIMIT 50
    `,
  );

  const byGame = await db.query<{ code: string; total: string; with_image: string }>(
    `
    SELECT coalesce(g.code, coalesce(p.game, 'NONE')) AS code,
           count(DISTINCT p.id)::text AS total,
           count(DISTINCT p.id) FILTER (WHERE ${hasImageSql})::text AS with_image
    FROM product_catalog.products p
    LEFT JOIN product_catalog.product_games pg ON pg.product_id = p.id
    LEFT JOIN product_catalog.games g ON g.id = pg.game_id
    WHERE p.category = 'SEALED_PRODUCT'
    GROUP BY 1
    ORDER BY count(DISTINCT p.id) DESC
    LIMIT 50
    `,
  );

  const byExpansion = await db.query<{ name: string; total: string; with_image: string }>(
    `
    SELECT coalesce(c.name, 'unknown') AS name,
           count(p.id)::text AS total,
           count(p.id) FILTER (WHERE ${hasImageSql})::text AS with_image
    FROM product_catalog.products p
    LEFT JOIN product_catalog.collections c ON c.id = p.collection_id
    WHERE p.category = 'SEALED_PRODUCT'
    GROUP BY 1
    ORDER BY count(p.id) DESC
    LIMIT 50
    `,
  );

  const dups = await db.query<{ c: string }>(
    `
    SELECT count(*)::text AS c FROM (
      SELECT a.sha256
      FROM media.assets a
      JOIN media.asset_links l ON l.asset_id = a.id
      GROUP BY a.sha256
      HAVING count(l.id) > 1
    ) d
    `,
  );

  const orphans = await db.query<{ c: string }>(
    `
    SELECT count(*)::text AS c
    FROM media.assets a
    WHERE NOT EXISTS (SELECT 1 FROM media.asset_links l WHERE l.asset_id = a.id)
    `,
  );

  const quality = await db.query<{ avg: string | null }>(
    `SELECT avg(quality_score)::text AS avg FROM product_catalog.products WHERE quality_score IS NOT NULL`,
  );

  const assetScore = await db.query<{ avg: string | null }>(
    `
    SELECT avg( (a.derivatives->'_meta'->>'assetQualityScore')::numeric )::text AS avg
    FROM media.assets a
    WHERE a.derivatives->'_meta'->>'assetQualityScore' IS NOT NULL
    `,
  );

  const replaced = await db.query<{ c: string }>(
    `
    SELECT count(*)::text AS c
    FROM platform.domain_events
    WHERE event_type IN ('AssetCreated', 'MediaUpdated')
      AND payload->>'replacedByHigherTrust' = 'true'
      AND occurred_at > now() - interval '90 days'
    `,
  );

  const updated = await db.query<{ c: string }>(
    `
    SELECT count(*)::text AS c
    FROM platform.domain_events
    WHERE event_type = 'MediaUpdated'
      AND occurred_at > now() - interval '90 days'
    `,
  );

  const history = await db.query<{ day: string; with_image: string; total: string }>(
    `
    SELECT to_char(date_trunc('day', p.updated_at), 'YYYY-MM-DD') AS day,
           count(*) FILTER (WHERE ${hasImageSql})::text AS with_image,
           count(*)::text AS total
    FROM product_catalog.products p
    WHERE p.updated_at > now() - interval '14 days'
    GROUP BY 1
    ORDER BY 1 ASC
    `,
  );

  const mapCov = <T extends { total: string; with_image: string }>(
    rows: T[],
    key: keyof T,
  ): Array<Record<string, string | number>> =>
    rows.map((r) => ({
      [key]: r[key] as string,
      total: Number(r.total),
      withImage: Number(r.with_image),
      coveragePct: pct(Number(r.with_image), Number(r.total)),
    }));

  const byMfrMapped = mapCov(byManufacturer.rows, "name") as AssetIngestionCoverageReport["byManufacturer"];
  const byPubMapped = mapCov(byPublisher.rows, "name") as AssetIngestionCoverageReport["byPublisher"];

  return {
    accessories,
    sealed,
    productsWithoutImage: Number(without.rows[0]?.c ?? 0),
    byManufacturer: byMfrMapped,
    byPublisher: byPubMapped,
    byGame: mapCov(byGame.rows, "code") as AssetIngestionCoverageReport["byGame"],
    byExpansion: mapCov(byExpansion.rows, "name") as AssetIngestionCoverageReport["byExpansion"],
    byCategory: mapCov(byCategory.rows, "category") as AssetIngestionCoverageReport["byCategory"],
    duplicateAssets: Number(dups.rows[0]?.c ?? 0),
    orphanAssets: Number(orphans.rows[0]?.c ?? 0),
    averageImageQuality: Number(quality.rows[0]?.avg ?? 0),
    averageAssetScore: Number(assetScore.rows[0]?.avg ?? 0),
    topManufacturers: byMfrMapped.slice(0, 10),
    topPublishers: byPubMapped.slice(0, 10),
    assetsReplaced: Number(replaced.rows[0]?.c ?? 0),
    assetsUpdated: Number(updated.rows[0]?.c ?? 0),
    coverageHistory: history.rows.map((r) => ({
      day: r.day,
      productsWithImage: Number(r.with_image),
      productsTotal: Number(r.total),
    })),
    generatedAt: new Date().toISOString(),
  };
}
