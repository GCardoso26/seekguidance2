/**
 * Official Product Collections — publisher-sourced sets of products.
 */

import type { Pool, PoolClient } from "pg";
import { getIdGenerator } from "../../shared/ids/IdGenerator.js";

type Q = Pool | PoolClient;

export interface UpsertCollectionInput {
  name: string;
  game?: string | null;
  code?: string | null;
  slug?: string | null;
  description?: string | null;
  expansionCode?: string | null;
  language?: string | null;
  region?: string | null;
  releaseDate?: string | null;
  publisherId?: string | null;
  official?: boolean;
}

export class ProductCollectionsService {
  constructor(private readonly db: Q) {}

  async upsert(input: UpsertCollectionInput) {
    const slug =
      input.slug ??
      input.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    const id = getIdGenerator().generate();

    if (input.code) {
      const res = await this.db.query(
        `
        INSERT INTO product_catalog.collections (
          id, name, game, code, slug, description, expansion_code, language, region,
          release_date, publisher_id, official
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::date,$11::uuid,$12)
        ON CONFLICT (code) WHERE code IS NOT NULL AND code <> '' DO UPDATE SET
          name = EXCLUDED.name,
          game = COALESCE(EXCLUDED.game, product_catalog.collections.game),
          slug = COALESCE(EXCLUDED.slug, product_catalog.collections.slug),
          description = COALESCE(EXCLUDED.description, product_catalog.collections.description),
          expansion_code = COALESCE(EXCLUDED.expansion_code, product_catalog.collections.expansion_code),
          language = COALESCE(EXCLUDED.language, product_catalog.collections.language),
          region = COALESCE(EXCLUDED.region, product_catalog.collections.region),
          release_date = COALESCE(EXCLUDED.release_date, product_catalog.collections.release_date),
          publisher_id = COALESCE(EXCLUDED.publisher_id, product_catalog.collections.publisher_id),
          official = COALESCE(EXCLUDED.official, product_catalog.collections.official),
          updated_at = now()
        RETURNING id
        `,
        [
          id,
          input.name,
          input.game ?? null,
          input.code,
          slug,
          input.description ?? null,
          input.expansionCode ?? null,
          input.language ?? null,
          input.region ?? null,
          input.releaseDate ?? null,
          input.publisherId ?? null,
          input.official ?? true,
        ],
      );
      return String(res.rows[0].id);
    }

    await this.db.query(
      `
      INSERT INTO product_catalog.collections (
        id, name, game, code, slug, description, expansion_code, language, region,
        release_date, publisher_id, official
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::date,$11::uuid,$12)
      `,
      [
        id,
        input.name,
        input.game ?? null,
        null,
        slug,
        input.description ?? null,
        input.expansionCode ?? null,
        input.language ?? null,
        input.region ?? null,
        input.releaseDate ?? null,
        input.publisherId ?? null,
        input.official ?? true,
      ],
    );
    return id;
  }

  async attachProduct(collectionId: string, productId: string): Promise<void> {
    await this.db.query(
      `UPDATE product_catalog.products SET collection_id = $1, updated_at = now() WHERE id = $2`,
      [collectionId, productId],
    );
  }

  async getBySlug(slug: string) {
    const res = await this.db.query(
      `SELECT * FROM product_catalog.collections WHERE slug = $1 LIMIT 1`,
      [slug],
    );
    return res.rows[0] ? mapCollection(res.rows[0]) : null;
  }

  async listProducts(collectionId: string, limit = 100) {
    const res = await this.db.query(
      `
      SELECT p.id, p.title_pt, p.category, p.subcategory, p.lifecycle, p.product_family, p.sku
      FROM product_catalog.products p
      WHERE p.collection_id = $1
      ORDER BY p.title_pt ASC
      LIMIT $2
      `,
      [collectionId, limit],
    );
    return res.rows.map((r) => ({
      id: String(r.id),
      titlePt: String(r.title_pt),
      category: String(r.category),
      subcategory: String(r.subcategory),
      lifecycle: String(r.lifecycle),
      productFamily: r.product_family as string | null,
      sku: r.sku as string | null,
    }));
  }
}

function mapCollection(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    name: String(row.name),
    game: row.game as string | null,
    code: row.code as string | null,
    slug: row.slug as string | null,
    description: row.description as string | null,
    expansionCode: row.expansion_code as string | null,
    language: row.language as string | null,
    region: row.region as string | null,
    releaseDate: row.release_date ? String(row.release_date).slice(0, 10) : null,
    publisherId: row.publisher_id as string | null,
    official: row.official !== false,
  };
}

export function createProductCollectionsService(db: Pool | PoolClient) {
  return new ProductCollectionsService(db);
}
