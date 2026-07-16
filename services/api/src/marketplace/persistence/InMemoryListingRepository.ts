import type { TxParticipant } from "../../platform/transaction/InMemoryTransactionManager.js";
import type { TxContext } from "../../platform/transaction/types.js";
import { getClock } from "../../shared/time/Clock.js";
import { getIdGenerator } from "../../shared/ids/IdGenerator.js";
import type { RepositoryResult } from "../../shared/persistence/RepositoryResult.js";
import type { ListingRepository } from "../domain/ListingRepository.js";
import type { Listing, ListingUpsert } from "../domain/models.js";

export class InMemoryListingRepository implements ListingRepository, TxParticipant {
  private rows = new Map<string, Listing>();
  private snapshots = new Map<string, Map<string, Listing>>();

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

  async upsert(_tx: TxContext, input: ListingUpsert): Promise<RepositoryResult<Listing>> {
    const now = getClock().now();
    const existing = input.id != null ? this.rows.get(input.id) : undefined;

    if (existing && input.expectedVersion != null && existing.rowVersion !== input.expectedVersion) {
      throw new Error(`optimistic_lock_failed:listing:${existing.id}`);
    }

    const next: Listing = {
      id: existing?.id ?? input.id ?? getIdGenerator().generate(),
      sellerId: input.sellerId,
      catalogCardId: input.catalogCardId,
      catalogVariantId: input.catalogVariantId,
      inventoryItemId: input.inventoryItemId ?? existing?.inventoryItemId ?? null,
      priceCents: input.priceCents,
      currency: input.currency ?? "BRL",
      condition: input.condition,
      language: input.language,
      notes: input.notes ?? null,
      finish: input.finish ?? null,
      quantity: input.quantity,
      status: input.status ?? existing?.status ?? "draft",
      rowVersion: existing ? existing.rowVersion + 1 : 1,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    if (!existing) {
      this.rows.set(next.id, next);
      return { outcome: "created", entity: structuredClone(next), previousVersion: null, currentVersion: 1 };
    }

    if (sameListing(existing, next)) {
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

  async findById(_tx: TxContext, id: string): Promise<Listing | null> {
    const row = this.rows.get(id);
    return row ? structuredClone(row) : null;
  }

  async listByCatalogCard(_tx: TxContext, catalogCardId: string): Promise<Listing[]> {
    return [...this.rows.values()]
      .filter((l) => l.catalogCardId === catalogCardId)
      .map((l) => structuredClone(l));
  }

  async listBySeller(_tx: TxContext, sellerId: string): Promise<Listing[]> {
    return [...this.rows.values()]
      .filter((l) => l.sellerId === sellerId)
      .map((l) => structuredClone(l));
  }
}

function sameListing(a: Listing, b: Listing): boolean {
  return (
    a.sellerId === b.sellerId &&
    a.catalogCardId === b.catalogCardId &&
    a.catalogVariantId === b.catalogVariantId &&
    a.inventoryItemId === b.inventoryItemId &&
    a.priceCents === b.priceCents &&
    a.currency === b.currency &&
    a.condition === b.condition &&
    a.language === b.language &&
    (a.notes || null) === (b.notes || null) &&
    (a.finish || null) === (b.finish || null) &&
    a.quantity === b.quantity &&
    a.status === b.status
  );
}

function cloneMap(src: Map<string, Listing>): Map<string, Listing> {
  const out = new Map<string, Listing>();
  for (const [k, v] of src) out.set(k, structuredClone(v));
  return out;
}
