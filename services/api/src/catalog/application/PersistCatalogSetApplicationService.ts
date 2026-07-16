import { createDomainEvent } from "../../shared/events/types.js";
import type { OutboxRepository } from "../../platform/outbox/types.js";
import type { TransactionManager } from "../../platform/transaction/types.js";
import { emitEventFor } from "../../shared/persistence/RepositoryResult.js";
import { metrics } from "../../platform/metrics/registry.js";
import type { CatalogSetRepository } from "../domain/CatalogSetRepository.js";
import type { ProviderMappingRepository } from "../domain/ProviderMappingRepository.js";
import type { CatalogSet, CatalogSetUpsert } from "../domain/models.js";

export interface PersistCatalogSetInput {
  requestId: string;
  correlationId?: string;
  provider: string;
  set: CatalogSetUpsert;
  providerSetId: string;
  mappingMetadata?: Record<string, unknown>;
}

export interface PersistCatalogSetResult {
  entity: CatalogSet;
  outcome: "created" | "updated" | "unchanged";
}

/** Application Service — Aggregate Root: CatalogSet (+ SET mapping). */
export class PersistCatalogSetApplicationService {
  constructor(
    private readonly tx: TransactionManager,
    private readonly sets: CatalogSetRepository,
    private readonly mappings: ProviderMappingRepository,
    private readonly outbox: OutboxRepository,
  ) {}

  async execute(input: PersistCatalogSetInput): Promise<PersistCatalogSetResult> {
    return this.tx.runInTransaction(async (txCtx) => {
      const setResult = await this.sets.upsert(txCtx, input.set);
      const set = setResult.entity;
      metrics.inc("repository_upsert_total", {
        aggregate: "set",
        outcome: setResult.outcome,
      });

      const mappingResult = await this.mappings.upsert(txCtx, {
        provider: input.provider,
        providerObjectType: "SET",
        providerSetId: input.providerSetId,
        catalogSetId: set.id,
        metadata: input.mappingMetadata ?? {},
      });
      metrics.inc("repository_upsert_total", {
        aggregate: "mapping",
        outcome: mappingResult.outcome,
      });

      if (emitEventFor(setResult) || emitEventFor(mappingResult)) {
        await this.outbox.insert(txCtx, {
          event: createDomainEvent(
            "SetUpdated",
            set.id,
            {
              gameId: set.gameId,
              code: set.code,
              name: set.name,
              outcome: setResult.outcome,
              rowVersion: set.rowVersion,
            },
            {
              requestId: input.requestId,
              aggregateType: "catalog_set",
              correlationId: input.correlationId ?? input.requestId,
              producer: "PersistCatalogSetApplicationService",
            },
          ),
        });
      }

      return { entity: set, outcome: setResult.outcome };
    });
  }
}
