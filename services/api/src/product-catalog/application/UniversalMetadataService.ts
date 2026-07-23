/**
 * Universal official metadata — single schema for all providers.
 */

import type { Pool, PoolClient } from "pg";
import {
  metadataCompleteness,
  type UniversalProductMetadata,
} from "../domain/universalMetadata.js";
import type { ProductLifecycle } from "../domain/knowledge.js";

type Q = Pool | PoolClient;

export class UniversalMetadataService {
  constructor(private readonly db: Q) {}

  async upsert(productId: string, meta: UniversalProductMetadata): Promise<void> {
    await this.db.query(
      `
      INSERT INTO product_catalog.product_official_metadata (
        product_id, publisher, manufacturer, game, expansion, collection, series,
        release_date, language, country, msrp_cents, sku, upc, ean, isbn,
        weight_grams, dimensions, contents_summary, materials, finish, rarity,
        product_line, product_family, edition, legal_status, lifecycle,
        asset_trust, asset_score, source, updated_at
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,
        $8::date,$9,$10,$11,$12,$13,$14,$15,
        $16,$17::jsonb,$18,$19,$20,$21,
        $22,$23,$24,$25,$26,
        $27,$28,'official', now()
      )
      ON CONFLICT (product_id) DO UPDATE SET
        publisher = COALESCE(EXCLUDED.publisher, product_catalog.product_official_metadata.publisher),
        manufacturer = COALESCE(EXCLUDED.manufacturer, product_catalog.product_official_metadata.manufacturer),
        game = COALESCE(EXCLUDED.game, product_catalog.product_official_metadata.game),
        expansion = COALESCE(EXCLUDED.expansion, product_catalog.product_official_metadata.expansion),
        collection = COALESCE(EXCLUDED.collection, product_catalog.product_official_metadata.collection),
        series = COALESCE(EXCLUDED.series, product_catalog.product_official_metadata.series),
        release_date = COALESCE(EXCLUDED.release_date, product_catalog.product_official_metadata.release_date),
        language = COALESCE(EXCLUDED.language, product_catalog.product_official_metadata.language),
        country = COALESCE(EXCLUDED.country, product_catalog.product_official_metadata.country),
        msrp_cents = COALESCE(EXCLUDED.msrp_cents, product_catalog.product_official_metadata.msrp_cents),
        sku = COALESCE(EXCLUDED.sku, product_catalog.product_official_metadata.sku),
        upc = COALESCE(EXCLUDED.upc, product_catalog.product_official_metadata.upc),
        ean = COALESCE(EXCLUDED.ean, product_catalog.product_official_metadata.ean),
        isbn = COALESCE(EXCLUDED.isbn, product_catalog.product_official_metadata.isbn),
        weight_grams = COALESCE(EXCLUDED.weight_grams, product_catalog.product_official_metadata.weight_grams),
        dimensions = product_catalog.product_official_metadata.dimensions || EXCLUDED.dimensions,
        contents_summary = COALESCE(EXCLUDED.contents_summary, product_catalog.product_official_metadata.contents_summary),
        materials = COALESCE(EXCLUDED.materials, product_catalog.product_official_metadata.materials),
        finish = COALESCE(EXCLUDED.finish, product_catalog.product_official_metadata.finish),
        rarity = COALESCE(EXCLUDED.rarity, product_catalog.product_official_metadata.rarity),
        product_line = COALESCE(EXCLUDED.product_line, product_catalog.product_official_metadata.product_line),
        product_family = COALESCE(EXCLUDED.product_family, product_catalog.product_official_metadata.product_family),
        edition = COALESCE(EXCLUDED.edition, product_catalog.product_official_metadata.edition),
        legal_status = COALESCE(EXCLUDED.legal_status, product_catalog.product_official_metadata.legal_status),
        lifecycle = COALESCE(EXCLUDED.lifecycle, product_catalog.product_official_metadata.lifecycle),
        asset_trust = COALESCE(EXCLUDED.asset_trust, product_catalog.product_official_metadata.asset_trust),
        asset_score = COALESCE(EXCLUDED.asset_score, product_catalog.product_official_metadata.asset_score),
        updated_at = now()
      `,
      [
        productId,
        meta.publisher ?? null,
        meta.manufacturer ?? null,
        meta.game ?? null,
        meta.expansion ?? null,
        meta.collection ?? null,
        meta.series ?? null,
        meta.releaseDate ?? null,
        meta.language ?? null,
        meta.country ?? null,
        meta.msrpCents ?? null,
        meta.sku ?? null,
        meta.upc ?? null,
        meta.ean ?? null,
        meta.isbn ?? null,
        meta.weightGrams ?? null,
        JSON.stringify(meta.dimensions ?? {}),
        meta.contents ?? null,
        meta.materials ?? null,
        meta.finish ?? null,
        meta.rarity ?? null,
        meta.productLine ?? null,
        meta.productFamily ?? null,
        meta.edition ?? null,
        meta.legalStatus ?? null,
        meta.lifecycle ?? null,
        meta.assetTrust ?? null,
        meta.assetScore ?? null,
      ],
    );

    if (meta.lifecycle) {
      await this.db.query(
        `UPDATE product_catalog.products SET lifecycle = $2, updated_at = now() WHERE id = $1`,
        [productId, meta.lifecycle],
      );
    }
    if (meta.productFamily) {
      await this.db.query(
        `UPDATE product_catalog.products SET product_family = $2, updated_at = now() WHERE id = $1`,
        [productId, meta.productFamily],
      );
    }

    const completeness = metadataCompleteness(meta);
    await this.db.query(
      `UPDATE product_catalog.products SET knowledge_completeness = $2, updated_at = now() WHERE id = $1`,
      [productId, completeness],
    );
  }

  async get(productId: string): Promise<UniversalProductMetadata | null> {
    const res = await this.db.query(
      `SELECT * FROM product_catalog.product_official_metadata WHERE product_id = $1`,
      [productId],
    );
    const r = res.rows[0];
    if (!r) return null;
    return {
      publisher: r.publisher,
      manufacturer: r.manufacturer,
      game: r.game,
      expansion: r.expansion,
      collection: r.collection,
      series: r.series,
      releaseDate: r.release_date ? String(r.release_date).slice(0, 10) : null,
      language: r.language,
      country: r.country,
      msrpCents: r.msrp_cents != null ? Number(r.msrp_cents) : null,
      sku: r.sku,
      upc: r.upc,
      ean: r.ean,
      isbn: r.isbn,
      weightGrams: r.weight_grams != null ? Number(r.weight_grams) : null,
      dimensions: (r.dimensions as UniversalProductMetadata["dimensions"]) ?? {},
      contents: r.contents_summary,
      materials: r.materials,
      finish: r.finish,
      rarity: r.rarity,
      productLine: r.product_line,
      productFamily: r.product_family,
      edition: r.edition,
      legalStatus: r.legal_status,
      lifecycle: r.lifecycle as ProductLifecycle | null,
      assetTrust: r.asset_trust != null ? Number(r.asset_trust) : null,
      assetScore: r.asset_score != null ? Number(r.asset_score) : null,
    };
  }
}

export function createUniversalMetadataService(db: Pool | PoolClient) {
  return new UniversalMetadataService(db);
}
