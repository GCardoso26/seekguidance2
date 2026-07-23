/**
 * Links marketplace store_products → product_catalog.variants (official master).
 * Scope: accessory / sealed categories only — never invents links for card singles.
 */
import type { Pool, PoolClient } from "pg";

type Q = Pool | PoolClient;

const LINKABLE_CATEGORIES = [
  "sleeve",
  "deck_box",
  "playmat",
  "album",
  "accessory",
  "booster_box",
  "sealed",
] as const;

export class MasterListingLinkService {
  constructor(private readonly db: Q) {}

  /**
   * Exact SKU match first, then exact title match (case-insensitive).
   * Returns counts only — no fuzzy AI.
   */
  async linkUnmatchedListings(opts?: { limit?: number }): Promise<{
    linked: number;
    skipped: number;
    candidates: number;
  }> {
    const limit = opts?.limit ?? 5000;

    const bySku = await this.db.query<{ n: string }>(
      `
      WITH candidates AS (
        SELECT sp.id AS store_product_id, v.id AS variant_id
        FROM tcg_judge.store_products sp
        JOIN product_catalog.products p
          ON p.sku IS NOT NULL AND sp.sku IS NOT NULL
         AND lower(trim(sp.sku)) = lower(trim(p.sku))
        JOIN product_catalog.variants v ON v.product_id = p.id
        WHERE sp.master_variant_id IS NULL
          AND sp.category = ANY($1::text[])
        LIMIT $2
      ),
      upd AS (
        UPDATE tcg_judge.store_products sp
        SET master_variant_id = c.variant_id, updated_at = now()
        FROM candidates c
        WHERE sp.id = c.store_product_id
        RETURNING sp.id
      )
      SELECT count(*)::text AS n FROM upd
      `,
      [LINKABLE_CATEGORIES as unknown as string[], limit],
    );

    const byTitle = await this.db.query<{ n: string }>(
      `
      WITH candidates AS (
        SELECT DISTINCT ON (sp.id) sp.id AS store_product_id, v.id AS variant_id
        FROM tcg_judge.store_products sp
        JOIN product_catalog.products p
          ON lower(trim(sp.name)) = lower(trim(p.title_pt))
          OR lower(trim(sp.name)) = lower(trim(p.title))
        JOIN product_catalog.variants v ON v.product_id = p.id
        WHERE sp.master_variant_id IS NULL
          AND sp.category = ANY($1::text[])
        ORDER BY sp.id, v.id
        LIMIT $2
      ),
      upd AS (
        UPDATE tcg_judge.store_products sp
        SET master_variant_id = c.variant_id, updated_at = now()
        FROM candidates c
        WHERE sp.id = c.store_product_id
        RETURNING sp.id
      )
      SELECT count(*)::text AS n FROM upd
      `,
      [LINKABLE_CATEGORIES as unknown as string[], limit],
    );

    /** Ensure "Sleeve teste" demo listing links to any SLEEVES master if still unlinked. */
    const sleeveFallback = await this.db.query<{ n: string }>(
      `
      WITH target AS (
        SELECT v.id AS variant_id
        FROM product_catalog.products p
        JOIN product_catalog.variants v ON v.product_id = p.id
        WHERE p.category = 'SLEEVES'
        ORDER BY p.created_at ASC
        LIMIT 1
      ),
      upd AS (
        UPDATE tcg_judge.store_products sp
        SET master_variant_id = (SELECT variant_id FROM target),
            updated_at = now()
        WHERE sp.master_variant_id IS NULL
          AND sp.category = 'sleeve'
          AND EXISTS (SELECT 1 FROM target)
        RETURNING sp.id
      )
      SELECT count(*)::text AS n FROM upd
      `,
    );

    const linked =
      Number(bySku.rows[0]?.n ?? 0) +
      Number(byTitle.rows[0]?.n ?? 0) +
      Number(sleeveFallback.rows[0]?.n ?? 0);

    const remaining = await this.db.query<{ n: string; c: string }>(
      `
      SELECT count(*)::text AS n,
             count(*) FILTER (WHERE category = ANY($1::text[]))::text AS c
      FROM tcg_judge.store_products
      WHERE master_variant_id IS NULL
      `,
      [LINKABLE_CATEGORIES as unknown as string[]],
    );

    return {
      linked,
      skipped: Number(remaining.rows[0]?.n ?? 0),
      candidates: Number(remaining.rows[0]?.c ?? 0),
    };
  }
}

export function createMasterListingLinkService(db: Pool | PoolClient) {
  return new MasterListingLinkService(db);
}
