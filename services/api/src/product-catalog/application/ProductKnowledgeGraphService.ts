/**
 * Product Knowledge Graph aggregate for Marketplace PDP / Portal.
 * Official data only — no AI.
 */

import type { Pool, PoolClient } from "pg";
import { createOfficialProductContentsService } from "./OfficialProductContentsService.js";
import { createOfficialSpecificationsService } from "./OfficialSpecificationsService.js";
import { createUniversalMetadataService } from "./UniversalMetadataService.js";
import { createProductAssetPackageService } from "./ProductAssetPackageService.js";
import { createProductRelationshipService } from "./ProductRelationshipService.js";
import { createProductCollectionsService } from "./ProductCollectionsService.js";

type Q = Pool | PoolClient;

export class ProductKnowledgeGraphService {
  constructor(private readonly db: Q) {}

  async getProductKnowledge(productId: string) {
    const productRes = await this.db.query(
      `
      SELECT p.*, c.name AS collection_name, c.slug AS collection_slug,
             pub.code AS publisher_code, pub.name AS publisher_name
      FROM product_catalog.products p
      LEFT JOIN product_catalog.collections c ON c.id = p.collection_id
      LEFT JOIN product_catalog.publishers pub ON pub.id = p.publisher_id
      WHERE p.id = $1
      `,
      [productId],
    );
    const p = productRes.rows[0];
    if (!p) return null;

    const contents = await createOfficialProductContentsService(this.db).getByProductId(productId);
    const specifications = await createOfficialSpecificationsService(this.db).listByProductId(
      productId,
    );
    const metadata = await createUniversalMetadataService(this.db).get(productId);
    const assetPackages = await createProductAssetPackageService(this.db).listByProductId(
      productId,
    );
    const related = await createProductRelationshipService(this.db).listRelatedForMarketplace(
      productId,
      24,
    );
    const entityRels = await createProductRelationshipService(this.db).listEntityTargets(productId);

    let collectionProducts: Awaited<
      ReturnType<ReturnType<typeof createProductCollectionsService>["listProducts"]>
    > = [];
    if (p.collection_id) {
      collectionProducts = await createProductCollectionsService(this.db).listProducts(
        String(p.collection_id),
        48,
      );
    }

    const taxonomy = {
      publisher: p.publisher_code ?? metadata?.publisher ?? null,
      game: p.game ?? metadata?.game ?? null,
      category: p.category,
      subcategory: p.subcategory,
      productFamily: p.product_family ?? metadata?.productFamily ?? null,
      productId,
      lifecycle: p.lifecycle,
    };

    return {
      productId,
      titlePt: p.title_pt,
      taxonomy,
      lifecycle: p.lifecycle,
      collection: p.collection_id
        ? {
            id: String(p.collection_id),
            name: p.collection_name as string,
            slug: p.collection_slug as string | null,
            products: collectionProducts,
          }
        : null,
      officialContents: contents,
      specifications,
      metadata,
      compatibleAccessories: related.filter((r) =>
        ["compatible_with", "accessory_for", "recommended_with", "recommended_for", "supports"].includes(
          r.relationType,
        ),
      ),
      relatedProducts: related,
      entityRelationships: entityRels,
      assetPackages,
      downloads: assetPackages.filter((a) =>
        ["pdf", "rules", "decklist", "marketing_kit", "release_notes", "press_kit"].includes(
          a.packageKind,
        ),
      ),
      marketingFiles: assetPackages.filter((a) =>
        ["marketing_kit", "banners", "social", "editorial", "press_kit"].includes(a.packageKind),
      ),
      releaseInformation: {
        releaseDate: metadata?.releaseDate ?? null,
        msrpCents: metadata?.msrpCents ?? contents?.msrpCents ?? null,
        language: metadata?.language ?? null,
        country: metadata?.country ?? null,
        expansion: metadata?.expansion ?? null,
        series: metadata?.series ?? null,
      },
    };
  }
}

export function createProductKnowledgeGraphService(db: Pool | PoolClient) {
  return new ProductKnowledgeGraphService(db);
}
