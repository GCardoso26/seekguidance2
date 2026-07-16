import type { TxContext } from "../../platform/transaction/types.js";
import type { RepositoryResult } from "../../shared/persistence/RepositoryResult.js";
import type { CatalogSet, CatalogSetUpsert } from "./models.js";

/** Aggregate Root: CatalogSet. */
export interface CatalogSetRepository {
  upsert(tx: TxContext, input: CatalogSetUpsert): Promise<RepositoryResult<CatalogSet>>;
  findById(tx: TxContext, id: string): Promise<CatalogSet | null>;
  findByGameAndCode(tx: TxContext, gameId: string, code: string): Promise<CatalogSet | null>;
}
