import type { TxParticipant } from "../../platform/transaction/InMemoryTransactionManager.js";
import type { TxContext } from "../../platform/transaction/types.js";
import { getClock } from "../../shared/time/Clock.js";
import { getIdGenerator } from "../../shared/ids/IdGenerator.js";
import type { RepositoryResult } from "../../shared/persistence/RepositoryResult.js";
import type { SellerRepository } from "../domain/SellerRepository.js";
import type { Seller, SellerUpsert } from "../domain/models.js";

export class InMemorySellerRepository implements SellerRepository, TxParticipant {
  private rows = new Map<string, Seller>();
  private snapshots = new Map<string, Map<string, Seller>>();

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

  async upsert(_tx: TxContext, input: SellerUpsert): Promise<RepositoryResult<Seller>> {
    const now = getClock().now();
    const existing =
      (input.id != null ? this.rows.get(input.id) : undefined) ??
      [...this.rows.values()].find((s) => s.slug === input.slug);

    if (existing && input.expectedVersion != null && existing.rowVersion !== input.expectedVersion) {
      throw new Error(`optimistic_lock_failed:seller:${existing.id}`);
    }

    const next: Seller = {
      id: existing?.id ?? input.id ?? getIdGenerator().generate(),
      displayName: input.displayName,
      slug: input.slug,
      status: input.status ?? existing?.status ?? "pending",
      verification: input.verification ?? existing?.verification ?? "unverified",
      configuration: input.configuration ?? existing?.configuration ?? {},
      rowVersion: existing ? existing.rowVersion + 1 : 1,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    if (!existing) {
      this.rows.set(next.id, next);
      return { outcome: "created", entity: structuredClone(next), previousVersion: null, currentVersion: 1 };
    }

    if (sameSeller(existing, next)) {
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

  async findById(_tx: TxContext, id: string): Promise<Seller | null> {
    const row = this.rows.get(id);
    return row ? structuredClone(row) : null;
  }

  async findBySlug(_tx: TxContext, slug: string): Promise<Seller | null> {
    const row = [...this.rows.values()].find((s) => s.slug === slug);
    return row ? structuredClone(row) : null;
  }
}

function sameSeller(a: Seller, b: Seller): boolean {
  return (
    a.displayName === b.displayName &&
    a.slug === b.slug &&
    a.status === b.status &&
    a.verification === b.verification &&
    JSON.stringify(a.configuration) === JSON.stringify(b.configuration)
  );
}

function cloneMap(src: Map<string, Seller>): Map<string, Seller> {
  const out = new Map<string, Seller>();
  for (const [k, v] of src) out.set(k, structuredClone(v));
  return out;
}
