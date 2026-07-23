import type { Pool, PoolClient } from "pg";
import type { AssetHealthReport } from "./AssetHealth.js";
import { createLogger } from "../../platform/logging/logger.js";

const log = createLogger("product-catalog.asset-health");
type Q = Pool | PoolClient;

/**
 * Builds Asset Health admin report from Product Catalog + media tables already joined elsewhere.
 */
export class AssetHealthService {
  constructor(private readonly db: Q) {}

  async computeReport(): Promise<AssetHealthReport> {
    const orphans = await this.db.query<{ c: string }>(
      `SELECT count(*)::text AS c FROM media.assets a
       WHERE NOT EXISTS (SELECT 1 FROM media.asset_links l WHERE l.asset_id = a.id)`,
    );
    const dups = await this.db.query<{ c: string }>(
      `SELECT count(*)::text AS c FROM (
         SELECT sha256 FROM media.assets GROUP BY sha256 HAVING count(*) > 1
       ) d`,
    );
    const missingHero = await this.db.query<{ c: string }>(
      `SELECT count(*)::text AS c FROM product_catalog.products p
       WHERE p.category = 'SEALED_PRODUCT'
         AND NOT EXISTS (
           SELECT 1 FROM product_catalog.variants v
           JOIN media.asset_links l ON l.entity_id = v.id AND l.entity_type = 'product_variant'
           WHERE v.product_id = p.id AND l.role IN ('primary','hero','front')
         )`,
    );
    const missingGallery = await this.db.query<{ c: string }>(
      `SELECT count(*)::text AS c FROM product_catalog.products p
       WHERE NOT EXISTS (
         SELECT 1 FROM product_catalog.variants v
         JOIN media.asset_links l ON l.entity_id = v.id AND l.entity_type = 'product_variant'
         WHERE v.product_id = p.id AND l.role = 'gallery'
       )`,
    );
    const missingDeriv = await this.db.query<{ c: string }>(
      `SELECT count(*)::text AS c FROM media.assets
       WHERE derivatives IS NULL OR derivatives = '{}'::jsonb`,
    );
    const missingMeta = await this.db.query<{ c: string }>(
      `SELECT count(*)::text AS c FROM media.assets
       WHERE derivatives->'_meta' IS NULL`,
    );
    const qualityDist = await this.db.query<{ bucket: string; c: string }>(
      `
      SELECT
        CASE
          WHEN qs >= 90 THEN '90-100'
          WHEN qs >= 70 THEN '70-89'
          WHEN qs >= 50 THEN '50-69'
          ELSE '0-49'
        END AS bucket,
        count(*)::text AS c
      FROM (
        SELECT coalesce((derivatives->'_meta'->>'assetQualityScore')::int, 0) AS qs
        FROM media.assets
      ) q
      GROUP BY 1 ORDER BY 1
      `,
    );
    const trustDist = await this.db.query<{ trust: string; c: string }>(
      `
      SELECT coalesce((derivatives->'_meta'->>'sourcePriority')::int, 0)::text AS trust,
             count(*)::text AS c
      FROM media.assets
      GROUP BY 1 ORDER BY 1 DESC
      LIMIT 20
      `,
    );
    const byGame = await this.db.query<{ code: string; assets: string }>(
      `
      SELECT coalesce(g.code, coalesce(p.game, 'NONE')) AS code, count(DISTINCT a.id)::text AS assets
      FROM product_catalog.products p
      LEFT JOIN product_catalog.product_games pg ON pg.product_id = p.id
      LEFT JOIN product_catalog.games g ON g.id = pg.game_id
      JOIN product_catalog.variants v ON v.product_id = p.id
      JOIN media.asset_links l ON l.entity_id = v.id AND l.entity_type = 'product_variant'
      JOIN media.assets a ON a.id = l.asset_id
      GROUP BY 1 ORDER BY count(DISTINCT a.id) DESC LIMIT 30
      `,
    );
    const byMfr = await this.db.query<{ name: string; assets: string }>(
      `
      SELECT coalesce(m.name, 'unknown') AS name, count(DISTINCT a.id)::text AS assets
      FROM product_catalog.products p
      LEFT JOIN product_catalog.manufacturers m ON m.id = p.manufacturer_id
      JOIN product_catalog.variants v ON v.product_id = p.id
      JOIN media.asset_links l ON l.entity_id = v.id AND l.entity_type = 'product_variant'
      JOIN media.assets a ON a.id = l.asset_id
      WHERE p.category <> 'SEALED_PRODUCT'
      GROUP BY 1 ORDER BY count(DISTINCT a.id) DESC LIMIT 30
      `,
    );
    const byPub = await this.db.query<{ name: string; assets: string }>(
      `
      SELECT coalesce(m.name, 'unknown') AS name, count(DISTINCT a.id)::text AS assets
      FROM product_catalog.products p
      LEFT JOIN product_catalog.manufacturers m ON m.id = p.manufacturer_id
      JOIN product_catalog.variants v ON v.product_id = p.id
      JOIN media.asset_links l ON l.entity_id = v.id AND l.entity_type = 'product_variant'
      JOIN media.assets a ON a.id = l.asset_id
      WHERE p.category = 'SEALED_PRODUCT'
      GROUP BY 1 ORDER BY count(DISTINCT a.id) DESC LIMIT 30
      `,
    );
    const byType = await this.db.query<{ type: string; assets: string }>(
      `
      SELECT coalesce(l.role, 'unknown') AS type, count(*)::text AS assets
      FROM media.asset_links l
      GROUP BY 1 ORDER BY count(*) DESC LIMIT 30
      `,
    );
    const byExp = await this.db.query<{ name: string; assets: string }>(
      `
      SELECT coalesce(c.name, 'unknown') AS name, count(DISTINCT a.id)::text AS assets
      FROM product_catalog.products p
      LEFT JOIN product_catalog.collections c ON c.id = p.collection_id
      JOIN product_catalog.variants v ON v.product_id = p.id
      JOIN media.asset_links l ON l.entity_id = v.id AND l.entity_type = 'product_variant'
      JOIN media.assets a ON a.id = l.asset_id
      WHERE p.category = 'SEALED_PRODUCT'
      GROUP BY 1 ORDER BY count(DISTINCT a.id) DESC LIMIT 30
      `,
    );

    const totalAssets = await this.db.query<{ c: string }>(`SELECT count(*)::text AS c FROM media.assets`);
    const healthyish = await this.db.query<{ c: string }>(
      `SELECT count(*)::text AS c FROM media.assets
       WHERE cdn_url IS NOT NULL AND sha256 IS NOT NULL AND derivatives IS NOT NULL AND derivatives <> '{}'::jsonb`,
    );
    const total = Number(totalAssets.rows[0]?.c ?? 0);
    const healthy = Number(healthyish.rows[0]?.c ?? 0);
    const overall = total ? Math.round((healthy / total) * 1000) / 10 : 0;

    const mapHealth = (rows: Array<{ name?: string; code?: string; type?: string; assets: string }>, key: string) =>
      rows.map((r) => ({
        [key]: (r as Record<string, string>)[key] ?? "unknown",
        healthPct: overall,
        assets: Number(r.assets),
      }));

    const report: AssetHealthReport = {
      overall,
      perPublisher: mapHealth(byPub.rows, "name") as AssetHealthReport["perPublisher"],
      perManufacturer: mapHealth(byMfr.rows, "name") as AssetHealthReport["perManufacturer"],
      perGame: mapHealth(byGame.rows, "code") as AssetHealthReport["perGame"],
      perExpansion: mapHealth(byExp.rows, "name") as AssetHealthReport["perExpansion"],
      perAssetType: mapHealth(byType.rows, "type") as AssetHealthReport["perAssetType"],
      orphans: Number(orphans.rows[0]?.c ?? 0),
      duplicates: Number(dups.rows[0]?.c ?? 0),
      missingHero: Number(missingHero.rows[0]?.c ?? 0),
      missingGallery: Number(missingGallery.rows[0]?.c ?? 0),
      missingDerivatives: Number(missingDeriv.rows[0]?.c ?? 0),
      missingMetadata: Number(missingMeta.rows[0]?.c ?? 0),
      qualityDistribution: qualityDist.rows.map((r) => ({ bucket: r.bucket, count: Number(r.c) })),
      trustDistribution: trustDist.rows.map((r) => ({ trust: Number(r.trust), count: Number(r.c) })),
      generatedAt: new Date().toISOString(),
    };

    try {
      await this.db.query(
        `INSERT INTO product_catalog.asset_health_snapshots (scope, scope_key, overall_pct, report)
         VALUES ('global','all',$1,$2::jsonb)`,
        [overall, JSON.stringify(report)],
      );
    } catch (e) {
      log.warn({ err: String(e) }, "asset_health_snapshot_skip");
    }

    return report;
  }
}

export function createAssetHealthService(db: Pool | PoolClient): AssetHealthService {
  return new AssetHealthService(db);
}
