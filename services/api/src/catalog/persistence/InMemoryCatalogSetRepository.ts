import type { TxParticipant } from "../../platform/transaction/InMemoryTransactionManager.js";
import type { TxContext } from "../../platform/transaction/types.js";
import { getClock } from "../../shared/time/Clock.js";
import { getIdGenerator } from "../../shared/ids/IdGenerator.js";
import type { RepositoryResult } from "../../shared/persistence/RepositoryResult.js";
import type { CatalogSetRepository } from "../domain/CatalogSetRepository.js";
import type { CatalogSet, CatalogSetUpsert } from "../domain/models.js";

export class InMemoryCatalogSetRepository implements CatalogSetRepository, TxParticipant {
  private rows = new Map<string, CatalogSet>();
  private snapshots = new Map<string, Map<string, CatalogSet>>();

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

  async upsert(_tx: TxContext, input: CatalogSetUpsert): Promise<RepositoryResult<CatalogSet>> {
    const now = getClock().now();
    const existing =
      (input.id != null ? this.rows.get(input.id) : undefined) ??
      [...this.rows.values()].find((s) => s.gameId === input.gameId && s.code === input.code);

    if (existing && input.expectedVersion != null && existing.rowVersion !== input.expectedVersion) {
      throw new Error(`optimistic_lock_failed:set:${existing.id}`);
    }

    const next: CatalogSet = {
      id: existing?.id ?? input.id ?? getIdGenerator().generate(),
      gameId: input.gameId,
      code: input.code,
      name: input.name,
      releaseDate: input.releaseDate ?? null,
      rowVersion: existing ? existing.rowVersion + 1 : 1,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    if (!existing) {
      this.rows.set(next.id, next);
      return { outcome: "created", entity: structuredClone(next), previousVersion: null, currentVersion: 1 };
    }

    if (
      existing.name === next.name &&
      (existing.releaseDate ?? null) === (next.releaseDate ?? null)
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

  async findById(_tx: TxContext, id: string): Promise<CatalogSet | null> {
    const row = this.rows.get(id);
    return row ? structuredClone(row) : null;
  }

  async findByGameAndCode(
    _tx: TxContext,
    gameId: string,
    code: string,
  ): Promise<CatalogSet | null> {
    const row = [...this.rows.values()].find((s) => s.gameId === gameId && s.code === code);
    return row ? structuredClone(row) : null;
  }

  allIds(): string[] {
    return [...this.rows.keys()];
  }
}

function cloneMap(src: Map<string, CatalogSet>): Map<string, CatalogSet> {
  const out = new Map<string, CatalogSet>();
  for (const [k, v] of src) out.set(k, structuredClone(v));
  return out;
}
