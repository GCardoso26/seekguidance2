import type { TxParticipant } from "../../platform/transaction/InMemoryTransactionManager.js";
import type { TxContext } from "../../platform/transaction/types.js";
import { getClock } from "../../shared/time/Clock.js";
import { getIdGenerator } from "../../shared/ids/IdGenerator.js";
import type { RepositoryResult } from "../../shared/persistence/RepositoryResult.js";
import type { CatalogVariantRepository } from "../domain/CatalogVariantRepository.js";
import type { CatalogVariant, CatalogVariantUpsert } from "../domain/models.js";

export class InMemoryCatalogVariantRepository implements CatalogVariantRepository, TxParticipant {
  private rows = new Map<string, CatalogVariant>();
  private snapshots = new Map<string, Map<string, CatalogVariant>>();

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
    input: CatalogVariantUpsert,
  ): Promise<RepositoryResult<CatalogVariant>> {
    const now = getClock().now();
    const existing = input.id != null ? this.rows.get(input.id) : undefined;

    if (existing && input.expectedVersion != null && existing.rowVersion !== input.expectedVersion) {
      throw new Error(`optimistic_lock_failed:variant:${existing.id}`);
    }

    const next: CatalogVariant = {
      id: existing?.id ?? input.id ?? getIdGenerator().generate(),
      cardId: input.cardId,
      finish: input.finish ?? null,
      language: input.language ?? null,
      isFoil: input.isFoil ?? false,
      label: input.label ?? null,
      metadata: input.metadata ?? {},
      rowVersion: existing ? existing.rowVersion + 1 : 1,
      createdAt: existing?.createdAt ?? now,
    };

    if (!existing) {
      this.rows.set(next.id, next);
      return { outcome: "created", entity: structuredClone(next), previousVersion: null, currentVersion: 1 };
    }

    if (
      existing.cardId === next.cardId &&
      (existing.finish ?? null) === (next.finish ?? null) &&
      (existing.language ?? null) === (next.language ?? null) &&
      existing.isFoil === next.isFoil &&
      (existing.label ?? null) === (next.label ?? null) &&
      JSON.stringify(existing.metadata) === JSON.stringify(next.metadata)
    ) {
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

  async findById(_tx: TxContext, id: string): Promise<CatalogVariant | null> {
    const row = this.rows.get(id);
    return row ? structuredClone(row) : null;
  }

  async findByCardId(_tx: TxContext, cardId: string): Promise<CatalogVariant[]> {
    return [...this.rows.values()]
      .filter((v) => v.cardId === cardId)
      .map((v) => structuredClone(v));
  }

  allIds(): string[] {
    return [...this.rows.keys()];
  }
}

function cloneMap(src: Map<string, CatalogVariant>): Map<string, CatalogVariant> {
  const out = new Map<string, CatalogVariant>();
  for (const [k, v] of src) out.set(k, structuredClone(v));
  return out;
}
