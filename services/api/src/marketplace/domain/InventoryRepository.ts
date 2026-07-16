import type { TxContext } from "../../platform/transaction/types.js";
import type { RepositoryResult } from "../../shared/persistence/RepositoryResult.js";
import type { InventoryItem, InventoryItemUpsert } from "./models.js";

/** Aggregate Root: Inventory (how many cards exist). No price. */
export interface InventoryRepository {
  upsert(tx: TxContext, input: InventoryItemUpsert): Promise<RepositoryResult<InventoryItem>>;
  findById(tx: TxContext, id: string): Promise<InventoryItem | null>;
  findBySellerAndVariant(
    tx: TxContext,
    sellerId: string,
    catalogVariantId: string,
  ): Promise<InventoryItem | null>;
  listBySeller(tx: TxContext, sellerId: string): Promise<InventoryItem[]>;
}
