import type { TxContext } from "../../platform/transaction/types.js";
import type { RepositoryResult } from "../../shared/persistence/RepositoryResult.js";
import type { CatalogVariant, CatalogVariantUpsert } from "./models.js";

/** Aggregate Root: CatalogVariant. */
export interface CatalogVariantRepository {
  upsert(tx: TxContext, input: CatalogVariantUpsert): Promise<RepositoryResult<CatalogVariant>>;
  findById(tx: TxContext, id: string): Promise<CatalogVariant | null>;
  findByCardId(tx: TxContext, cardId: string): Promise<CatalogVariant[]>;
}
