import type { TxParticipant } from "../../platform/transaction/InMemoryTransactionManager.js";
import type { TxContext } from "../../platform/transaction/types.js";
import { getClock } from "../../shared/time/Clock.js";
import { getIdGenerator } from "../../shared/ids/IdGenerator.js";
import type { RepositoryResult } from "../../shared/persistence/RepositoryResult.js";
import type { CatalogCardRepository } from "../domain/CatalogCardRepository.js";
import type { CatalogCard, CatalogCardUpsert } from "../domain/models.js";

export class InMemoryCatalogCardRepository implements CatalogCardRepository, TxParticipant {
  private rows = new Map<string, CatalogCard>();
  private snapshots = new Map<string, Map<string, CatalogCard>>();

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

  async upsert(_tx: TxContext, input: CatalogCardUpsert): Promise<RepositoryResult<CatalogCard>> {
    const now = getClock().now();
    const existing =
      input.id != null
        ? this.rows.get(input.id)
        : [...this.rows.values()].find(
            (c) =>
              c.gameId === input.gameId &&
              c.normalizedName === input.normalizedName &&
              (c.setId ?? null) === (input.setId ?? null) &&
              (c.cardNumber ?? null) === (input.cardNumber ?? null),
          );

    if (existing && input.expectedVersion != null && existing.rowVersion !== input.expectedVersion) {
      throw new Error(`optimistic_lock_failed:card:${existing.id}`);
    }

    const next: CatalogCard = {
      id: existing?.id ?? input.id ?? getIdGenerator().generate(),
      gameId: input.gameId,
      setId: input.setId ?? null,
      name: input.name,
      normalizedName: input.normalizedName,
      cardNumber: input.cardNumber ?? null,
      rarity: input.rarity ?? null,
      language: input.language ?? "en",
      oracleText: input.oracleText ?? null,
      typeLine: input.typeLine ?? null,
      artist: input.artist ?? null,
      gameData: input.gameData ?? {},
      rowVersion: existing ? existing.rowVersion + 1 : 1,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    if (!existing) {
      this.rows.set(next.id, next);
      return { outcome: "created", entity: structuredClone(next), previousVersion: null, currentVersion: 1 };
    }

    if (sameCardContent(existing, next)) {
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

  async findById(_tx: TxContext, id: string): Promise<CatalogCard | null> {
    const row = this.rows.get(id);
    return row ? structuredClone(row) : null;
  }

  async findByGameAndNormalizedName(
    _tx: TxContext,
    gameId: string,
    normalizedName: string,
  ): Promise<CatalogCard[]> {
    return [...this.rows.values()]
      .filter((c) => c.gameId === gameId && c.normalizedName === normalizedName)
      .map((c) => structuredClone(c));
  }

  /** Contract / consistency helpers — enumeration for InMemory only. */
  allIds(): string[] {
    return [...this.rows.keys()];
  }
}

function sameCardContent(a: CatalogCard, b: CatalogCard): boolean {
  return (
    a.gameId === b.gameId &&
    (a.setId ?? null) === (b.setId ?? null) &&
    a.name === b.name &&
    a.normalizedName === b.normalizedName &&
    (a.cardNumber ?? null) === (b.cardNumber ?? null) &&
    (a.rarity ?? null) === (b.rarity ?? null) &&
    a.language === b.language &&
    (a.oracleText || null) === (b.oracleText || null) &&
    (a.typeLine ?? null) === (b.typeLine ?? null) &&
    (a.artist ?? null) === (b.artist ?? null) &&
    stableJson(a.gameData) === stableJson(b.gameData)
  );
}

function stableJson(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(obj).sort()) out[k] = sortKeys(obj[k]);
    return out;
  }
  return value;
}

function cloneMap(src: Map<string, CatalogCard>): Map<string, CatalogCard> {
  const out = new Map<string, CatalogCard>();
  for (const [k, v] of src) out.set(k, structuredClone(v));
  return out;
}
