import { createDomainEvent } from "../../shared/events/types.js";
import type { OutboxRepository } from "../../platform/outbox/types.js";
import type { TransactionManager } from "../../platform/transaction/types.js";
import { emitEventFor } from "../../shared/persistence/RepositoryResult.js";
import { metrics } from "../../platform/metrics/registry.js";
import type { CatalogCardRepository } from "../domain/CatalogCardRepository.js";
import type { ProviderMappingRepository } from "../domain/ProviderMappingRepository.js";
import type { CatalogCard, CatalogCardUpsert } from "../domain/models.js";
import { normalizeCardName } from "../domain/models.js";

export interface PersistCatalogCardInput {
  requestId: string;
  correlationId?: string;
  provider: string;
  card: CatalogCardUpsert;
  mapping: {
    providerCardId: string;
    providerSetId?: string | null;
    metadata?: Record<string, unknown>;
  };
}

export interface PersistCatalogCardResult {
  entity: CatalogCard;
  outcome: "created" | "updated" | "unchanged";
}

/**
 * Application Service — Aggregate Root: CatalogCard (+ CARD mapping).
 * Does NOT persist Set — use PersistCatalogSetApplicationService / SyncSetCommand first.
 */
export class PersistCatalogCardApplicationService {
  constructor(
    private readonly tx: TransactionManager,
    private readonly cards: CatalogCardRepository,
    private readonly mappings: ProviderMappingRepository,
    private readonly outbox: OutboxRepository,
  ) {}

  async execute(input: PersistCatalogCardInput): Promise<PersistCatalogCardResult> {
    return this.tx.runInTransaction(async (txCtx) => {
      // Identity bridge: resolve catalog id via provider mapping before upsert (idempotent sync).
      const prior =
        (await this.mappings.findByProviderObject(txCtx, input.provider, "CARD", {
          providerCardId: input.mapping.providerCardId,
          providerSetId: input.mapping.providerSetId ?? null,
        })) ??
        (await this.mappings.findByProviderCardId(
          txCtx,
          input.provider,
          input.mapping.providerCardId,
        ));
      const cardInput: CatalogCardUpsert = {
        ...input.card,
        id: input.card.id ?? prior?.catalogCardId ?? undefined,
        normalizedName: input.card.normalizedName || normalizeCardName(input.card.name),
      };
      const cardResult = await this.cards.upsert(txCtx, cardInput);
      const card = cardResult.entity;
      metrics.inc("repository_upsert_total", {
        aggregate: "card",
        outcome: cardResult.outcome,
      });

      const mappingResult = await this.mappings.upsert(txCtx, {
        provider: input.provider,
        providerObjectType: "CARD",
        providerCardId: input.mapping.providerCardId,
        providerSetId: input.mapping.providerSetId ?? null,
        catalogCardId: card.id,
        catalogSetId: card.setId,
        metadata: input.mapping.metadata ?? {},
      });
      metrics.inc("repository_upsert_total", {
        aggregate: "mapping",
        outcome: mappingResult.outcome,
      });

      if (emitEventFor(cardResult) || emitEventFor(mappingResult)) {
        await this.outbox.insert(txCtx, {
          event: createDomainEvent(
            "CardUpdated",
            card.id,
            {
              gameId: card.gameId,
              setId: card.setId,
              name: card.name,
              provider: input.provider,
              providerCardId: input.mapping.providerCardId,
              outcome: cardResult.outcome,
              rowVersion: card.rowVersion,
            },
            {
              requestId: input.requestId,
              aggregateType: "catalog_card",
              correlationId: input.correlationId ?? input.requestId,
              producer: "PersistCatalogCardApplicationService",
            },
          ),
        });
      }

      return { entity: card, outcome: cardResult.outcome };
    });
  }
}
