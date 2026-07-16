import type { TxContext } from "../../platform/transaction/types.js";
import type { RepositoryResult } from "../../shared/persistence/RepositoryResult.js";
import type { SellerProfile, SellerProfileUpsert } from "./models.js";

/** Aggregate Root: SellerProfile (bridge Identity → Marketplace). */
export interface SellerProfileRepository {
  upsert(tx: TxContext, input: SellerProfileUpsert): Promise<RepositoryResult<SellerProfile>>;
  findById(tx: TxContext, id: string): Promise<SellerProfile | null>;
  findByUserId(tx: TxContext, userId: string): Promise<SellerProfile | null>;
  findBySellerId(tx: TxContext, sellerId: string): Promise<SellerProfile | null>;
}
