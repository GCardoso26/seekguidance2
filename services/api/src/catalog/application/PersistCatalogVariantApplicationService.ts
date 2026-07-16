import { createDomainEvent } from "../../shared/events/types.js";
import type { OutboxRepository } from "../../platform/outbox/types.js";
import type { TransactionManager } from "../../platform/transaction/types.js";
import { emitEventFor } from "../../shared/persistence/RepositoryResult.js";
import { metrics } from "../../platform/metrics/registry.js";
import type { CatalogVariantRepository } from "../domain/CatalogVariantRepository.js";
import type { ProviderMappingRepository } from "../domain/ProviderMappingRepository.js";
import type { CatalogVariant, CatalogVariantUpsert } from "../domain/models.js";

export interface PersistCatalogVariantInput {
  requestId: string;
  correlationId?: string;
  provider: string;
  variant: CatalogVariantUpsert;
  mapping: {
    providerVariantId: string;
    providerCardId?: string | null;
    metadata?: Record<string, unknown>;
  };
}

export interface PersistCatalogVariantResult {
  entity: CatalogVariant;
  outcome: "created" | "updated" | "unchanged";
}

/** Application Service — Aggregate Root: CatalogVariant (+ VARIANT mapping). */
export class PersistCatalogVariantApplicationService {
  constructor(
    private readonly tx: TransactionManager,
    private readonly variants: CatalogVariantRepository,
    private readonly mappings: ProviderMappingRepository,
    private readonly outbox: OutboxRepository,
  ) {}

  async execute(input: PersistCatalogVariantInput): Promise<PersistCatalogVariantResult> {
    return this.tx.runInTransaction(async (txCtx) => {
      // Identity bridge: resolve catalog id via provider mapping before upsert (idempotent sync).
      const prior = await this.mappings.findByProviderObject(txCtx, input.provider, "VARIANT", {
        providerVariantId: input.mapping.providerVariantId,
        providerCardId: input.mapping.providerCardId ?? null,
      });
      const variantInput: CatalogVariantUpsert = {
        ...input.variant,
        id: input.variant.id ?? prior?.catalogVariantId ?? undefined,
      };
      const variantResult = await this.variants.upsert(txCtx, variantInput);
      const variant = variantResult.entity;
      metrics.inc("repository_upsert_total", {
        aggregate: "variant",
        outcome: variantResult.outcome,
      });

      const mappingResult = await this.mappings.upsert(txCtx, {
        provider: input.provider,
        providerObjectType: "VARIANT",
        providerVariantId: input.mapping.providerVariantId,
        providerCardId: input.mapping.providerCardId ?? null,
        catalogVariantId: variant.id,
        catalogCardId: variant.cardId,
        metadata: input.mapping.metadata ?? {},
      });
      metrics.inc("repository_upsert_total", {
        aggregate: "mapping",
        outcome: mappingResult.outcome,
      });

      if (emitEventFor(variantResult) || emitEventFor(mappingResult)) {
        await this.outbox.insert(txCtx, {
          event: createDomainEvent(
            "VariantUpdated",
            variant.id,
            {
              cardId: variant.cardId,
              finish: variant.finish,
              isFoil: variant.isFoil,
              outcome: variantResult.outcome,
              rowVersion: variant.rowVersion,
            },
            {
              requestId: input.requestId,
              aggregateType: "catalog_variant",
              correlationId: input.correlationId ?? input.requestId,
              producer: "PersistCatalogVariantApplicationService",
            },
          ),
        });
      }

      return { entity: variant, outcome: variantResult.outcome };
    });
  }
}
