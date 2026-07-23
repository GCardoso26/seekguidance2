/**
 * Universal Asset Package pointers — Product Catalog only; reuses Asset Pipeline.
 */

import type { Pool, PoolClient } from "pg";
import { getIdGenerator } from "../../shared/ids/IdGenerator.js";
import type { AssetPackageKind } from "../domain/knowledge.js";

type Q = Pool | PoolClient;

export interface UpsertAssetPackageItemInput {
  productId: string;
  packageKind: AssetPackageKind | string;
  title?: string | null;
  sourceUrl?: string | null;
  assetId?: string | null;
  role?: string | null;
  language?: string | null;
  sourceTrust?: number;
  official?: boolean;
  metadata?: Record<string, unknown>;
}

export class ProductAssetPackageService {
  constructor(private readonly db: Q) {}

  async upsertItem(input: UpsertAssetPackageItemInput) {
    const id = getIdGenerator().generate();
    const res = await this.db.query(
      `
      INSERT INTO product_catalog.product_asset_packages (
        id, product_id, package_kind, title, source_url, asset_id, role,
        language, source_trust, official, metadata
      ) VALUES ($1,$2,$3,$4,$5,$6::uuid,$7,$8,$9,$10,$11::jsonb)
      RETURNING *
      `,
      [
        id,
        input.productId,
        input.packageKind,
        input.title ?? null,
        input.sourceUrl ?? null,
        input.assetId ?? null,
        input.role ?? null,
        input.language ?? null,
        input.sourceTrust ?? 80,
        input.official ?? true,
        JSON.stringify(input.metadata ?? {}),
      ],
    );
    return mapPkg(res.rows[0]);
  }

  async listByProductId(productId: string) {
    const res = await this.db.query(
      `
      SELECT * FROM product_catalog.product_asset_packages
      WHERE product_id = $1
      ORDER BY package_kind, created_at DESC
      `,
      [productId],
    );
    return res.rows.map(mapPkg);
  }
}

function mapPkg(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    productId: String(row.product_id),
    packageKind: String(row.package_kind),
    title: row.title as string | null,
    sourceUrl: row.source_url as string | null,
    assetId: row.asset_id as string | null,
    role: row.role as string | null,
    language: row.language as string | null,
    sourceTrust: Number(row.source_trust),
    official: Boolean(row.official),
    metadata: (row.metadata as Record<string, unknown>) ?? {},
  };
}

export function createProductAssetPackageService(db: Pool | PoolClient) {
  return new ProductAssetPackageService(db);
}
