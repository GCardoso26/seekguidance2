import type { Pool, PoolClient } from "pg";
import { appendDomainEvent } from "../../platform/events/DomainEventStore.js";
import { computeQualityScore, type QualityBreakdown } from "../application/qualityScore.js";

type Q = Pool | PoolClient;

export async function recordProductRevision(
  db: Q,
  productId: string,
  snapshot: Record<string, unknown>,
  opts: { changedFields: string[]; changedBy?: string; reason?: string },
): Promise<number> {
  const last = await db.query<{ revision: number }>(
    `SELECT coalesce(max(revision), 0) AS revision FROM product_catalog.product_revisions WHERE product_id = $1`,
    [productId],
  );
  const revision = Number(last.rows[0]?.revision ?? 0) + 1;
  await db.query(
    `
    INSERT INTO product_catalog.product_revisions (
      product_id, revision, snapshot, changed_fields, changed_by, reason
    ) VALUES ($1,$2,$3::jsonb,$4,$5,$6)
    `,
    [
      productId,
      revision,
      JSON.stringify(snapshot),
      opts.changedFields,
      opts.changedBy ?? null,
      opts.reason ?? null,
    ],
  );
  await appendDomainEvent(db, {
    eventType: "ProductRevised",
    aggregateType: "product",
    aggregateId: productId,
    payload: { revision, changedFields: opts.changedFields },
  });
  return revision;
}

export async function upsertProductTranslation(
  db: Q,
  productId: string,
  locale: "pt-BR" | "en" | "es" | "jp",
  title: string,
  description?: string,
): Promise<void> {
  await db.query(
    `
    INSERT INTO product_catalog.product_translations (product_id, locale, title, description)
    VALUES ($1,$2,$3,$4)
    ON CONFLICT (product_id, locale) DO UPDATE SET
      title = EXCLUDED.title,
      description = COALESCE(EXCLUDED.description, product_catalog.product_translations.description),
      updated_at = now()
    `,
    [productId, locale, title, description ?? null],
  );
}

export async function refreshProductQuality(db: Q, productId: string): Promise<number> {
  const res = await db.query(
    `
    SELECT
      p.description IS NOT NULL AND length(trim(p.description)) > 20 AS has_description,
      p.ean IS NOT NULL AS has_ean,
      p.sku IS NOT NULL AS has_sku,
      p.collection_id IS NOT NULL AS has_collection,
      p.manufacturer_id IS NOT NULL AS has_manufacturer,
      EXISTS (
        SELECT 1 FROM product_catalog.variants v
        JOIN media.asset_links l ON l.entity_id = v.id AND l.entity_type = 'product_variant'
        WHERE v.product_id = p.id
      ) AS has_images,
      EXISTS (
        SELECT 1 FROM product_catalog.variants v
        JOIN product_catalog.product_attributes a ON a.variant_id = v.id
        WHERE v.product_id = p.id
      ) AS has_attributes,
      EXISTS (
        SELECT 1 FROM product_catalog.product_translations t WHERE t.product_id = p.id
      ) AS has_translations
    FROM product_catalog.products p
    WHERE p.id = $1
    `,
    [productId],
  );
  const row = res.rows[0];
  if (!row) return 0;
  const breakdown: QualityBreakdown = {
    hasDescription: Boolean(row.has_description),
    hasImages: Boolean(row.has_images),
    hasAttributes: Boolean(row.has_attributes),
    hasEan: Boolean(row.has_ean),
    hasSku: Boolean(row.has_sku),
    hasCollection: Boolean(row.has_collection),
    hasManufacturer: Boolean(row.has_manufacturer),
    hasTranslations: Boolean(row.has_translations),
  };
  const { score, breakdown: detail } = computeQualityScore(breakdown);
  await db.query(
    `UPDATE product_catalog.products SET quality_score = $2, quality_breakdown = $3::jsonb, updated_at = now() WHERE id = $1`,
    [productId, score, JSON.stringify(detail)],
  );
  return score;
}
