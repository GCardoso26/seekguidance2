import type { TxContext } from "../../platform/transaction/types.js";
import type { RepositoryResult } from "../../shared/persistence/RepositoryResult.js";
import type { CatalogCard, CatalogCardUpsert } from "./models.js";

/**
 * Aggregate Root: CatalogCard.
 * No generic save(any) — explicit upsert / find methods only.
 */
export interface CatalogCardRepository {
  upsert(tx: TxContext, input: CatalogCardUpsert): Promise<RepositoryResult<CatalogCard>>;
  findById(tx: TxContext, id: string): Promise<CatalogCard | null>;
  findByGameAndNormalizedName(
    tx: TxContext,
    gameId: string,
    normalizedName: string,
  ): Promise<CatalogCard[]>;
}
