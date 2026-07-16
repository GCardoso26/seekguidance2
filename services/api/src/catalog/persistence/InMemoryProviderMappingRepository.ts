import type { TxParticipant } from "../../platform/transaction/InMemoryTransactionManager.js";
import type { TxContext } from "../../platform/transaction/types.js";
import { getClock } from "../../shared/time/Clock.js";
import { getIdGenerator } from "../../shared/ids/IdGenerator.js";
import type { RepositoryResult } from "../../shared/persistence/RepositoryResult.js";
import type { ProviderMappingRepository } from "../domain/ProviderMappingRepository.js";
import type {
  ProviderMapping,
  ProviderMappingUpsert,
  ProviderObjectType,
} from "../domain/models.js";

export class InMemoryProviderMappingRepository
  implements ProviderMappingRepository, TxParticipant
{
  private rows = new Map<string, ProviderMapping>();
  private snapshots = new Map<string, Map<string, ProviderMapping>>();

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
    input: ProviderMappingUpsert,
  ): Promise<RepositoryResult<ProviderMapping>> {
    const now = getClock().now();
    const existing =
      (input.id != null ? this.rows.get(input.id) : undefined) ??
      (await this.findByProviderObject(_tx, input.provider, input.providerObjectType, {
        providerCardId: input.providerCardId,
        providerSetId: input.providerSetId,
        providerVariantId: input.providerVariantId,
      })) ??
      (input.providerObjectType === "CARD" && input.providerCardId
        ? await this.findByProviderCardId(_tx, input.provider, input.providerCardId)
        : null);

    if (existing && input.expectedVersion != null && existing.rowVersion !== input.expectedVersion) {
      throw new Error(`optimistic_lock_failed:mapping:${existing.id}`);
    }

    const next: ProviderMapping = {
      id: existing?.id ?? input.id ?? getIdGenerator().generate(),
      provider: input.provider,
      providerObjectType: input.providerObjectType,
      providerCardId: input.providerCardId ?? null,
      providerSetId: input.providerSetId ?? null,
      providerVariantId: input.providerVariantId ?? null,
      catalogCardId: input.catalogCardId ?? null,
      catalogSetId: input.catalogSetId ?? null,
      catalogVariantId: input.catalogVariantId ?? null,
      metadata: input.metadata ?? {},
      rowVersion: existing ? existing.rowVersion + 1 : 1,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    if (!existing) {
      this.rows.set(next.id, next);
      return { outcome: "created", entity: structuredClone(next), previousVersion: null, currentVersion: 1 };
    }

    if (
      (existing.catalogCardId ?? null) === (next.catalogCardId ?? null) &&
      (existing.catalogSetId ?? null) === (next.catalogSetId ?? null) &&
      (existing.catalogVariantId ?? null) === (next.catalogVariantId ?? null) &&
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

  async findById(_tx: TxContext, id: string): Promise<ProviderMapping | null> {
    const row = this.rows.get(id);
    return row ? structuredClone(row) : null;
  }

  async findByProviderObject(
    _tx: TxContext,
    provider: string,
    providerObjectType: ProviderObjectType,
    keys: {
      providerCardId?: string | null;
      providerSetId?: string | null;
      providerVariantId?: string | null;
    },
  ): Promise<ProviderMapping | null> {
    const row = [...this.rows.values()].find(
      (m) =>
        m.provider === provider &&
        m.providerObjectType === providerObjectType &&
        (m.providerCardId ?? "") === (keys.providerCardId ?? "") &&
        (m.providerSetId ?? "") === (keys.providerSetId ?? "") &&
        (m.providerVariantId ?? "") === (keys.providerVariantId ?? ""),
    );
    return row ? structuredClone(row) : null;
  }

  async findByProviderCardId(
    _tx: TxContext,
    provider: string,
    providerCardId: string,
  ): Promise<ProviderMapping | null> {
    const row = [...this.rows.values()].find(
      (m) =>
        m.provider === provider &&
        m.providerObjectType === "CARD" &&
        m.providerCardId === providerCardId,
    );
    return row ? structuredClone(row) : null;
  }

  allIds(): string[] {
    return [...this.rows.keys()];
  }
}

function cloneMap(src: Map<string, ProviderMapping>): Map<string, ProviderMapping> {
  const out = new Map<string, ProviderMapping>();
  for (const [k, v] of src) out.set(k, structuredClone(v));
  return out;
}
