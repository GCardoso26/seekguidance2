import type { TxContext } from "../../platform/transaction/types.js";
import type { RepositoryResult } from "../../shared/persistence/RepositoryResult.js";
import type { Listing, ListingUpsert } from "./models.js";

/** Aggregate Root: Listing (how much it costs). References Catalog IDs only. */
export interface ListingRepository {
  upsert(tx: TxContext, input: ListingUpsert): Promise<RepositoryResult<Listing>>;
  findById(tx: TxContext, id: string): Promise<Listing | null>;
  listByCatalogCard(tx: TxContext, catalogCardId: string): Promise<Listing[]>;
  listBySeller(tx: TxContext, sellerId: string): Promise<Listing[]>;
}
