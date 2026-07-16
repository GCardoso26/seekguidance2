import { createDomainEvent } from "../../shared/events/types.js";
import type { OutboxRepository } from "../../platform/outbox/types.js";
import type { TransactionManager } from "../../platform/transaction/types.js";
import { emitEventFor } from "../../shared/persistence/RepositoryResult.js";
import { metrics } from "../../platform/metrics/registry.js";
import type { ListingRepository } from "../domain/ListingRepository.js";
import type { Listing, ListingUpsert } from "../domain/models.js";

export interface PublishListingInput {
  requestId: string;
  correlationId?: string;
  listing: ListingUpsert;
}

export interface PublishListingResult {
  entity: Listing;
  outcome: "created" | "updated" | "unchanged";
}

/**
 * Aggregate 3 — Listing (how much it costs).
 * References Catalog IDs only; on write emits MarketplaceListingUpdated via Outbox
 * (the only event the Marketplace exposes to Search — ADR-004/ADR-007).
 */
export class PublishListingApplicationService {
  constructor(
    private readonly tx: TransactionManager,
    private readonly listings: ListingRepository,
    private readonly outbox: OutboxRepository,
  ) {}

  async execute(input: PublishListingInput): Promise<PublishListingResult> {
    if (input.listing.priceCents < 0) throw new Error("listing_price_negative");
    if (input.listing.quantity < 0) throw new Error("listing_quantity_negative");

    return this.tx.runInTransaction(async (txCtx) => {
      const result = await this.listings.upsert(txCtx, input.listing);
      const listing = result.entity;
      metrics.inc("repository_upsert_total", { aggregate: "listing", outcome: result.outcome });

      if (emitEventFor(result)) {
        await this.outbox.insert(txCtx, {
          event: createDomainEvent(
            "MarketplaceListingUpdated",
            listing.id,
            {
              cardId: listing.catalogCardId,
              variantId: listing.catalogVariantId,
              storeId: listing.sellerId,
              price: listing.priceCents,
              currency: listing.currency,
              stock: listing.status === "active" ? listing.quantity : 0,
              finish: listing.finish,
              condition: listing.condition,
              status: listing.status,
            },
            {
              requestId: input.requestId,
              aggregateType: "listing",
              correlationId: input.correlationId ?? input.requestId,
              producer: "PublishListingApplicationService",
            },
          ),
        });
      }

      return { entity: listing, outcome: result.outcome };
    });
  }
}
