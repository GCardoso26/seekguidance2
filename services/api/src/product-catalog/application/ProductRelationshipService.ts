import type { Pool, PoolClient } from "pg";
import { ProductRelationshipRepository } from "../persistence/ProductRelationshipRepository.js";
import type {
  ProductRelationType,
  RelatedProductView,
  UpsertProductRelationshipInput,
} from "../domain/relationships.js";
import { createLogger } from "../../platform/logging/logger.js";

const log = createLogger("product-catalog.relationships");

/**
 * Official Product Relationship Engine — no AI/embeddings/LLM.
 * Seeds and queries only publisher/manufacturer official graphs.
 */
export class ProductRelationshipService {
  private readonly repo: ProductRelationshipRepository;

  constructor(db: Pool | PoolClient) {
    this.repo = new ProductRelationshipRepository(db);
  }

  upsert(input: UpsertProductRelationshipInput) {
    return this.repo.upsert(input);
  }

  listFrom(productId: string, relationTypes?: ProductRelationType[]) {
    return this.repo.listFrom(productId, { relationTypes, officialOnly: true });
  }

  /** Marketplace / PDP — related official products. */
  listRelatedForMarketplace(productId: string, limit = 24): Promise<RelatedProductView[]> {
    return this.repo.listRelatedProducts(productId, limit);
  }

  /**
   * Upsert bidirectional official pair (contains ↔ contained_in / includes ↔ included_by).
   */
  async upsertOfficialPair(
    fromProductId: string,
    toProductId: string,
    forward: ProductRelationType,
    reverse: ProductRelationType,
    meta: { publisher?: string; manufacturer?: string; source?: string; confidence?: number },
  ): Promise<void> {
    await this.repo.upsert({
      fromProductId,
      toProductId,
      toEntityType: "product",
      relationType: forward,
      official: true,
      source: meta.source ?? "official",
      confidence: meta.confidence ?? 1,
      publisher: meta.publisher,
      manufacturer: meta.manufacturer,
    });
    await this.repo.upsert({
      fromProductId: toProductId,
      toProductId: fromProductId,
      toEntityType: "product",
      relationType: reverse,
      official: true,
      source: meta.source ?? "official",
      confidence: meta.confidence ?? 1,
      publisher: meta.publisher,
      manufacturer: meta.manufacturer,
    });
    log.info({ fromProductId, toProductId, forward, reverse }, "official_relationship_upserted");
  }

  /** Cross-publisher / cross-game official link (e.g. sleeve → compatible_with → MTG). */
  async upsertCompatibleWithGame(
    fromProductId: string,
    gameCode: string,
    meta?: { manufacturer?: string; relationType?: ProductRelationType; source?: string },
  ) {
    return this.repo.upsert({
      fromProductId,
      toProductId: null,
      toGameCode: gameCode,
      toEntityType: "game",
      toEntityRef: gameCode,
      relationType: meta?.relationType ?? "compatible_with",
      official: true,
      source: meta?.source ?? "official",
      manufacturer: meta?.manufacturer,
    });
  }

  listEntityTargets(productId: string) {
    return this.repo.listEntityTargets(productId);
  }

  /** Secondary search boost: +small score if candidate is related to a matched product. */
  async relationshipBoostScores(
    matchedProductIds: string[],
    candidateProductIds: string[],
  ): Promise<Map<string, number>> {
    const boost = new Map<string, number>();
    if (!matchedProductIds.length || !candidateProductIds.length) return boost;
    const related = await this.repo.listTargetsRelatedToAny(matchedProductIds, candidateProductIds);
    for (const id of related) {
      boost.set(id, (boost.get(id) ?? 0) + 0.05);
    }
    return boost;
  }
}

export function createProductRelationshipService(db: Pool | PoolClient): ProductRelationshipService {
  return new ProductRelationshipService(db);
}
