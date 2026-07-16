import type { TxParticipant } from "../../platform/transaction/InMemoryTransactionManager.js";
import type { TxContext } from "../../platform/transaction/types.js";
import { getClock } from "../../shared/time/Clock.js";
import { getIdGenerator } from "../../shared/ids/IdGenerator.js";
import type { RepositoryResult } from "../../shared/persistence/RepositoryResult.js";
import type { InventoryRepository } from "../domain/InventoryRepository.js";
import type { InventoryItem, InventoryItemUpsert } from "../domain/models.js";

export class InMemoryInventoryRepository implements InventoryRepository, TxParticipant {
  private rows = new Map<string, InventoryItem>();
  private snapshots = new Map<string, Map<string, InventoryItem>>();

  beginTx(txId: string): void {
    this.snapshots.set(txId, cloneMap(this.rows));
  }
  commitTx(txId: string): void {
    this.snapshots.delete(txId);
  }
  rollbackTx(txId: string): void {
    const snap = this.snapshots.get(txId);
    if (snap) this.rows = snap;
    this.snapshots.delete(txId);
  }

  async upsert(_tx: TxContext, input: InventoryItemUpsert): Promise<RepositoryResult<InventoryItem>> {
    const now = getClock().now();
    const existing =
      (input.id != null ? this.rows.get(input.id) : undefined) ??
      [...this.rows.values()].find(
        (i) => i.sellerId === input.sellerId && i.catalogVariantId === input.catalogVariantId,
      );

    if (existing && input.expectedVersion != null && existing.rowVersion !== input.expectedVersion) {
      throw new Error(`optimistic_lock_failed:inventory:${existing.id}`);
    }

    const next: InventoryItem = {
      id: existing?.id ?? input.id ?? getIdGenerator().generate(),
      sellerId: input.sellerId,
      catalogCardId: input.catalogCardId,
      catalogVariantId: input.catalogVariantId,
      quantity: input.quantity,
      rowVersion: existing ? existing.rowVersion + 1 : 1,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    if (!existing) {
      this.rows.set(next.id, next);
      return { outcome: "created", entity: structuredClone(next), previousVersion: null, currentVersion: 1 };
    }

    if (existing.quantity === next.quantity && existing.catalogCardId === next.catalogCardId) {
      return {
        outcome: "unchanged",
        entity: structuredClone(existing),
        previousVersion: existing.rowVersion,
        currentVersion: existing.rowVersion,
      };
    }

    this.rows.set(next.id, next);
    return {
      outcome: "updated",
      entity: structuredClone(next),
      previousVersion: existing.rowVersion,
      currentVersion: next.rowVersion,
    };
  }

  async findById(_tx: TxContext, id: string): Promise<InventoryItem | null> {
    const row = this.rows.get(id);
    return row ? structuredClone(row) : null;
  }

  async findBySellerAndVariant(
    _tx: TxContext,
    sellerId: string,
    catalogVariantId: string,
  ): Promise<InventoryItem | null> {
    const row = [...this.rows.values()].find(
      (i) => i.sellerId === sellerId && i.catalogVariantId === catalogVariantId,
    );
    return row ? structuredClone(row) : null;
  }

  async listBySeller(_tx: TxContext, sellerId: string): Promise<InventoryItem[]> {
    return [...this.rows.values()]
      .filter((i) => i.sellerId === sellerId)
      .map((i) => structuredClone(i));
  }
}

function cloneMap(src: Map<string, InventoryItem>): Map<string, InventoryItem> {
  const out = new Map<string, InventoryItem>();
  for (const [k, v] of src) out.set(k, structuredClone(v));
  return out;
}
