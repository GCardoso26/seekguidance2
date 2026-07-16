import type { TxContext } from "../../platform/transaction/types.js";
import type { RepositoryResult } from "../../shared/persistence/RepositoryResult.js";
import type { Seller, SellerUpsert } from "./models.js";

/** Aggregate Root: Seller (who sells). */
export interface SellerRepository {
  upsert(tx: TxContext, input: SellerUpsert): Promise<RepositoryResult<Seller>>;
  findById(tx: TxContext, id: string): Promise<Seller | null>;
  findBySlug(tx: TxContext, slug: string): Promise<Seller | null>;
}
