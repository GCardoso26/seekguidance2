import type { TxParticipant } from "../../platform/transaction/InMemoryTransactionManager.js";
import type { TxContext } from "../../platform/transaction/types.js";
import { getClock } from "../../shared/time/Clock.js";
import { getIdGenerator } from "../../shared/ids/IdGenerator.js";
import type { RepositoryResult } from "../../shared/persistence/RepositoryResult.js";
import type { SellerProfileRepository } from "../domain/SellerProfileRepository.js";
import type { SellerProfile, SellerProfileUpsert } from "../domain/models.js";

export class InMemorySellerProfileRepository implements SellerProfileRepository, TxParticipant {
  private rows = new Map<string, SellerProfile>();
  private snapshots = new Map<string, Map<string, SellerProfile>>();

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

  async upsert(
    _tx: TxContext,
    input: SellerProfileUpsert,
  ): Promise<RepositoryResult<SellerProfile>> {
    const now = getClock().now();
    const existing =
      (input.id != null ? this.rows.get(input.id) : undefined) ??
      [...this.rows.values()].find((p) => p.userId === input.userId);

    if (existing && input.expectedVersion != null && existing.rowVersion !== input.expectedVersion) {
      throw new Error(`optimistic_lock_failed:seller_profile:${existing.id}`);
    }

    const next: SellerProfile = {
      id: existing?.id ?? input.id ?? getIdGenerator().generate(),
      userId: input.userId,
      sellerId: input.sellerId,
      rowVersion: existing ? existing.rowVersion + 1 : 1,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    if (!existing) {
      this.rows.set(next.id, next);
      return { outcome: "created", entity: structuredClone(next), previousVersion: null, currentVersion: 1 };
    }

    if (existing.userId === next.userId && existing.sellerId === next.sellerId) {
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

  async findById(_tx: TxContext, id: string): Promise<SellerProfile | null> {
    const row = this.rows.get(id);
    return row ? structuredClone(row) : null;
  }

  async findByUserId(_tx: TxContext, userId: string): Promise<SellerProfile | null> {
    const row = [...this.rows.values()].find((p) => p.userId === userId);
    return row ? structuredClone(row) : null;
  }

  async findBySellerId(_tx: TxContext, sellerId: string): Promise<SellerProfile | null> {
    const row = [...this.rows.values()].find((p) => p.sellerId === sellerId);
    return row ? structuredClone(row) : null;
  }
}

function cloneMap(src: Map<string, SellerProfile>): Map<string, SellerProfile> {
  const out = new Map<string, SellerProfile>();
  for (const [k, v] of src) out.set(k, structuredClone(v));
  return out;
}
