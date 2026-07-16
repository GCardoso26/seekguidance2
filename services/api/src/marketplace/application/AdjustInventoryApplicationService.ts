import type { TransactionManager } from "../../platform/transaction/types.js";
import type { RepositoryResult } from "../../shared/persistence/RepositoryResult.js";
import type { InventoryRepository } from "../domain/InventoryRepository.js";
import type { InventoryItem, InventoryItemUpsert } from "../domain/models.js";

/**
 * Aggregate 2 — Inventory (how many cards exist). No price here.
 */
export class AdjustInventoryApplicationService {
  constructor(
    private readonly tx: TransactionManager,
    private readonly inventory: InventoryRepository,
  ) {}

  async execute(input: InventoryItemUpsert): Promise<RepositoryResult<InventoryItem>> {
    if (input.quantity < 0) throw new Error("inventory_quantity_negative");
    return this.tx.runInTransaction((txCtx) => this.inventory.upsert(txCtx, input));
  }
}
