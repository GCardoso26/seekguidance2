/**
 * Official product specifications — structured schemas only (no free-form SoT).
 */

import type { Pool, PoolClient } from "pg";
import { getIdGenerator } from "../../shared/ids/IdGenerator.js";
import type { SpecSchema } from "../domain/knowledge.js";

type Q = Pool | PoolClient;

export interface ProductSpecificationInput {
  productId: string;
  specSchema: SpecSchema | string;
  widthMm?: number | null;
  heightMm?: number | null;
  depthMm?: number | null;
  thicknessMm?: number | null;
  weightGrams?: number | null;
  capacity?: number | null;
  pieces?: number | null;
  microns?: number | null;
  material?: string | null;
  finish?: string | null;
  color?: string | null;
  closure?: string | null;
  surface?: string | null;
  pvcFree?: boolean | null;
  acidFree?: boolean | null;
  waterResistant?: boolean | null;
  stitchedBorder?: boolean | null;
  rubberThicknessMm?: number | null;
  cardsCount?: number | null;
  foilsCount?: number | null;
  language?: string | null;
  region?: string | null;
  msrpCents?: number | null;
  extra?: Record<string, unknown>;
  source?: string;
  official?: boolean;
}

export class OfficialSpecificationsService {
  constructor(private readonly db: Q) {}

  async upsert(input: ProductSpecificationInput) {
    const id = getIdGenerator().generate();
    const res = await this.db.query(
      `
      INSERT INTO product_catalog.product_specifications (
        id, product_id, spec_schema,
        width_mm, height_mm, depth_mm, thickness_mm, weight_grams,
        capacity, pieces, microns, material, finish, color, closure, surface,
        pvc_free, acid_free, water_resistant, stitched_border, rubber_thickness_mm,
        cards_count, foils_count, language, region, msrp_cents, extra, source, official
      ) VALUES (
        $1,$2,$3,
        $4,$5,$6,$7,$8,
        $9,$10,$11,$12,$13,$14,$15,$16,
        $17,$18,$19,$20,$21,
        $22,$23,$24,$25,$26,$27::jsonb,$28,$29
      )
      ON CONFLICT (product_id, spec_schema) DO UPDATE SET
        width_mm = COALESCE(EXCLUDED.width_mm, product_catalog.product_specifications.width_mm),
        height_mm = COALESCE(EXCLUDED.height_mm, product_catalog.product_specifications.height_mm),
        depth_mm = COALESCE(EXCLUDED.depth_mm, product_catalog.product_specifications.depth_mm),
        thickness_mm = COALESCE(EXCLUDED.thickness_mm, product_catalog.product_specifications.thickness_mm),
        weight_grams = COALESCE(EXCLUDED.weight_grams, product_catalog.product_specifications.weight_grams),
        capacity = COALESCE(EXCLUDED.capacity, product_catalog.product_specifications.capacity),
        pieces = COALESCE(EXCLUDED.pieces, product_catalog.product_specifications.pieces),
        microns = COALESCE(EXCLUDED.microns, product_catalog.product_specifications.microns),
        material = COALESCE(EXCLUDED.material, product_catalog.product_specifications.material),
        finish = COALESCE(EXCLUDED.finish, product_catalog.product_specifications.finish),
        color = COALESCE(EXCLUDED.color, product_catalog.product_specifications.color),
        closure = COALESCE(EXCLUDED.closure, product_catalog.product_specifications.closure),
        surface = COALESCE(EXCLUDED.surface, product_catalog.product_specifications.surface),
        pvc_free = COALESCE(EXCLUDED.pvc_free, product_catalog.product_specifications.pvc_free),
        acid_free = COALESCE(EXCLUDED.acid_free, product_catalog.product_specifications.acid_free),
        water_resistant = COALESCE(EXCLUDED.water_resistant, product_catalog.product_specifications.water_resistant),
        stitched_border = COALESCE(EXCLUDED.stitched_border, product_catalog.product_specifications.stitched_border),
        rubber_thickness_mm = COALESCE(EXCLUDED.rubber_thickness_mm, product_catalog.product_specifications.rubber_thickness_mm),
        cards_count = COALESCE(EXCLUDED.cards_count, product_catalog.product_specifications.cards_count),
        foils_count = COALESCE(EXCLUDED.foils_count, product_catalog.product_specifications.foils_count),
        language = COALESCE(EXCLUDED.language, product_catalog.product_specifications.language),
        region = COALESCE(EXCLUDED.region, product_catalog.product_specifications.region),
        msrp_cents = COALESCE(EXCLUDED.msrp_cents, product_catalog.product_specifications.msrp_cents),
        extra = product_catalog.product_specifications.extra || EXCLUDED.extra,
        source = EXCLUDED.source,
        official = EXCLUDED.official,
        updated_at = now()
      RETURNING *
      `,
      [
        id,
        input.productId,
        input.specSchema,
        input.widthMm ?? null,
        input.heightMm ?? null,
        input.depthMm ?? null,
        input.thicknessMm ?? null,
        input.weightGrams ?? null,
        input.capacity ?? null,
        input.pieces ?? null,
        input.microns ?? null,
        input.material ?? null,
        input.finish ?? null,
        input.color ?? null,
        input.closure ?? null,
        input.surface ?? null,
        input.pvcFree ?? null,
        input.acidFree ?? null,
        input.waterResistant ?? null,
        input.stitchedBorder ?? null,
        input.rubberThicknessMm ?? null,
        input.cardsCount ?? null,
        input.foilsCount ?? null,
        input.language ?? null,
        input.region ?? null,
        input.msrpCents ?? null,
        JSON.stringify(input.extra ?? {}),
        input.source ?? "official",
        input.official ?? true,
      ],
    );
    return mapSpec(res.rows[0]);
  }

  async listByProductId(productId: string) {
    const res = await this.db.query(
      `SELECT * FROM product_catalog.product_specifications WHERE product_id = $1 ORDER BY spec_schema`,
      [productId],
    );
    return res.rows.map(mapSpec);
  }
}

function mapSpec(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    productId: String(row.product_id),
    specSchema: String(row.spec_schema),
    widthMm: row.width_mm != null ? Number(row.width_mm) : null,
    heightMm: row.height_mm != null ? Number(row.height_mm) : null,
    depthMm: row.depth_mm != null ? Number(row.depth_mm) : null,
    thicknessMm: row.thickness_mm != null ? Number(row.thickness_mm) : null,
    weightGrams: row.weight_grams != null ? Number(row.weight_grams) : null,
    capacity: row.capacity != null ? Number(row.capacity) : null,
    pieces: row.pieces != null ? Number(row.pieces) : null,
    microns: row.microns != null ? Number(row.microns) : null,
    material: row.material as string | null,
    finish: row.finish as string | null,
    color: row.color as string | null,
    closure: row.closure as string | null,
    surface: row.surface as string | null,
    pvcFree: row.pvc_free as boolean | null,
    acidFree: row.acid_free as boolean | null,
    waterResistant: row.water_resistant as boolean | null,
    stitchedBorder: row.stitched_border as boolean | null,
    rubberThicknessMm: row.rubber_thickness_mm != null ? Number(row.rubber_thickness_mm) : null,
    cardsCount: row.cards_count != null ? Number(row.cards_count) : null,
    foilsCount: row.foils_count != null ? Number(row.foils_count) : null,
    language: row.language as string | null,
    region: row.region as string | null,
    msrpCents: row.msrp_cents != null ? Number(row.msrp_cents) : null,
    extra: (row.extra as Record<string, unknown>) ?? {},
    source: String(row.source),
    official: Boolean(row.official),
  };
}

export function createOfficialSpecificationsService(db: Pool | PoolClient) {
  return new OfficialSpecificationsService(db);
}
