import type { Pool, PoolClient } from "pg";
import { getIdGenerator } from "../../shared/ids/IdGenerator.js";
import type {
  EntityRelationshipView,
  ProductRelationship,
  ProductRelationType,
  RelatedProductView,
  RelationshipEntityType,
  UpsertProductRelationshipInput,
} from "../domain/relationships.js";
import { buildRelationshipTargetKey } from "../domain/relationships.js";

type Q = Pool | PoolClient;

function mapRow(row: Record<string, unknown>): ProductRelationship {
  return {
    id: String(row.id),
    fromProductId: String(row.from_product_id),
    toProductId: row.to_product_id ? String(row.to_product_id) : null,
    toGameCode: (row.to_game_code as string | null) ?? null,
    toEntityType: (row.to_entity_type as RelationshipEntityType) ?? "product",
    toEntityRef: (row.to_entity_ref as string | null) ?? null,
    relationType: row.relation_type as ProductRelationType,
    source: String(row.source),
    confidence: Number(row.confidence),
    official: Boolean(row.official),
    publisher: row.publisher as string | null,
    manufacturer: row.manufacturer as string | null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

export class ProductRelationshipRepository {
  constructor(private readonly db: Q) {}

  async upsert(input: UpsertProductRelationshipInput): Promise<ProductRelationship> {
    const id = getIdGenerator().generate();
    const toEntityType = input.toEntityType ?? (input.toProductId ? "product" : "game");
    const targetKey = buildRelationshipTargetKey({
      toProductId: input.toProductId,
      toEntityType,
      toEntityRef: input.toEntityRef,
      toGameCode: input.toGameCode,
    });

    const res = await this.db.query(
      `
      INSERT INTO product_catalog.product_relationships (
        id, from_product_id, to_product_id, to_game_code, to_entity_type, to_entity_ref,
        target_key, relation_type, source, confidence,
        official, publisher, manufacturer, metadata
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14::jsonb)
      ON CONFLICT (from_product_id, relation_type, target_key) DO UPDATE SET
        to_product_id = EXCLUDED.to_product_id,
        to_game_code = EXCLUDED.to_game_code,
        to_entity_type = EXCLUDED.to_entity_type,
        to_entity_ref = EXCLUDED.to_entity_ref,
        source = EXCLUDED.source,
        confidence = EXCLUDED.confidence,
        official = EXCLUDED.official,
        publisher = COALESCE(EXCLUDED.publisher, product_catalog.product_relationships.publisher),
        manufacturer = COALESCE(EXCLUDED.manufacturer, product_catalog.product_relationships.manufacturer),
        metadata = product_catalog.product_relationships.metadata || EXCLUDED.metadata,
        updated_at = now()
      RETURNING *
      `,
      [
        id,
        input.fromProductId,
        input.toProductId ?? null,
        input.toGameCode ?? null,
        toEntityType,
        input.toEntityRef ?? null,
        targetKey,
        input.relationType,
        input.source ?? "official",
        input.confidence ?? 1,
        input.official ?? true,
        input.publisher ?? null,
        input.manufacturer ?? null,
        JSON.stringify(input.metadata ?? {}),
      ],
    );
    return mapRow(res.rows[0]);
  }

  async listFrom(
    productId: string,
    opts?: { relationTypes?: ProductRelationType[]; officialOnly?: boolean },
  ): Promise<ProductRelationship[]> {
    const types = opts?.relationTypes;
    const res = await this.db.query(
      `
      SELECT * FROM product_catalog.product_relationships
      WHERE from_product_id = $1
        AND ($2::text[] IS NULL OR relation_type = ANY($2))
        AND ($3::boolean IS FALSE OR official = true)
      ORDER BY confidence DESC, updated_at DESC
      `,
      [productId, types ?? null, opts?.officialOnly ?? true],
    );
    return res.rows.map(mapRow);
  }

  async listRelatedProducts(productId: string, limit = 24): Promise<RelatedProductView[]> {
    const res = await this.db.query(
      `
      SELECT
        p.id AS product_id,
        p.title_pt,
        p.category,
        p.subcategory,
        r.relation_type,
        r.confidence,
        (
          SELECT a.cdn_url
          FROM product_catalog.variants v
          JOIN media.asset_links l ON l.entity_id = v.id AND l.entity_type = 'product_variant'
          JOIN media.assets a ON a.id = l.asset_id
          WHERE v.product_id = p.id
          ORDER BY CASE l.role WHEN 'primary' THEN 0 ELSE 1 END, l.sort_order
          LIMIT 1
        ) AS image_url
      FROM product_catalog.product_relationships r
      JOIN product_catalog.products p ON p.id = r.to_product_id
      WHERE r.from_product_id = $1 AND r.official = true AND r.to_product_id IS NOT NULL
      ORDER BY r.confidence DESC, p.title_pt ASC
      LIMIT $2
      `,
      [productId, limit],
    );
    return res.rows.map((row) => ({
      productId: String(row.product_id),
      titlePt: String(row.title_pt),
      category: String(row.category),
      subcategory: String(row.subcategory),
      relationType: row.relation_type as ProductRelationType,
      confidence: Number(row.confidence),
      imageUrl: row.image_url as string | null,
    }));
  }

  async listEntityTargets(productId: string): Promise<EntityRelationshipView[]> {
    const res = await this.db.query(
      `
      SELECT relation_type, to_entity_type, to_entity_ref, to_game_code, confidence
      FROM product_catalog.product_relationships
      WHERE from_product_id = $1 AND official = true AND to_product_id IS NULL
      ORDER BY confidence DESC
      `,
      [productId],
    );
    return res.rows.map((r) => ({
      relationType: r.relation_type as ProductRelationType,
      toEntityType: r.to_entity_type as RelationshipEntityType,
      toEntityRef: r.to_entity_ref as string | null,
      toGameCode: r.to_game_code as string | null,
      confidence: Number(r.confidence),
    }));
  }

  async listTargetsRelatedToAny(fromIds: string[], candidateIds: string[]): Promise<string[]> {
    if (!fromIds.length || !candidateIds.length) return [];
    const res = await this.db.query<{ to_product_id: string }>(
      `
      SELECT DISTINCT to_product_id
      FROM product_catalog.product_relationships
      WHERE from_product_id = ANY($1::uuid[])
        AND to_product_id = ANY($2::uuid[])
        AND official = true
        AND to_product_id IS NOT NULL
      `,
      [fromIds, candidateIds],
    );
    return res.rows.map((r) => String(r.to_product_id));
  }

  async delete(id: string): Promise<boolean> {
    const res = await this.db.query(
      `DELETE FROM product_catalog.product_relationships WHERE id = $1`,
      [id],
    );
    return (res.rowCount ?? 0) > 0;
  }
}
