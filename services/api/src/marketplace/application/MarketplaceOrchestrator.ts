import type { Pool } from "pg";
import { getIdGenerator } from "../../shared/ids/IdGenerator.js";
import { createInventoryService } from "../../inventory/InventoryService.js";
import { createPricingService } from "../../pricing/PricingService.js";
import { appendDomainEvent } from "../../platform/events/DomainEventStore.js";
import {
  createSagaOrchestrator,
  type SagaDefinition,
} from "../../platform/saga/SagaOrchestrator.js";
import { createLogger } from "../../platform/logging/logger.js";

const log = createLogger("marketplace.orchestrator");

export interface PublishProductListingCommand {
  requestId: string;
  correlationId?: string;
  sellerId: string;
  /** Catalog master variant — Marketplace never owns title/image/brand. */
  productVariantId: string;
  priceCents: number;
  stock: number;
  condition: string;
  currency?: "BRL";
  actorId?: string;
  /** Optional bridge to legacy store_products. */
  legacyStoreProductId?: string;
}

export interface PublishProductListingResult {
  listingId: string;
  sagaId: string;
  status: string;
  stockUnitId?: string;
  error?: string;
}

interface ListingSagaContext extends Record<string, unknown> {
  requestId: string;
  sellerId: string;
  productVariantId: string;
  priceCents: number;
  stock: number;
  condition: string;
  currency: string;
  actorId?: string;
  listingId?: string;
  stockUnitId?: string;
}

/**
 * Marketplace BC = orchestrator only.
 * Persist listing reference → Inventory → Pricing → Search → Analytics → Notification
 * via Saga. No Catalog/Pricing/Inventory business logic here.
 */
export class MarketplaceOrchestrator {
  constructor(private readonly pool: Pool) {}

  async publishProductListing(
    cmd: PublishProductListingCommand,
  ): Promise<PublishProductListingResult> {
    if (cmd.priceCents <= 0) throw new Error("listing_price_invalid");
    if (cmd.stock < 0) throw new Error("listing_stock_invalid");

    const correlationId = cmd.correlationId ?? cmd.requestId;
    const inventory = createInventoryService(this.pool);
    const pricing = createPricingService(this.pool);
    const saga = createSagaOrchestrator(this.pool);

    const definition: SagaDefinition<ListingSagaContext> = {
      sagaType: "PublishProductListing",
      steps: [
        {
          name: "EnsureSeller",
          execute: async (ctx) => {
            await this.pool.query(
              `
              INSERT INTO marketplace.sellers (id, display_name, slug, status, verification)
              VALUES ($1, $2, $3, 'active', 'unverified')
              ON CONFLICT (id) DO NOTHING
              `,
              [ctx.sellerId, `Seller ${String(ctx.sellerId).slice(0, 8)}`, `seller-${ctx.sellerId}`],
            );
            return {};
          },
        },
        {
          name: "PersistListing",
          execute: async (ctx) => {
            const listingId = getIdGenerator().generate();
            await this.pool.query(
              `
              INSERT INTO marketplace.listings (
                id, seller_id, subject_type, product_variant_id,
                price_cents, currency, condition, language, quantity, status, published_at
              ) VALUES ($1,$2,'product_variant',$3,$4,$5,$6,'pt-BR',$7,'active', now())
              `,
              [
                listingId,
                ctx.sellerId,
                ctx.productVariantId,
                ctx.priceCents,
                ctx.currency,
                ctx.condition,
                ctx.stock,
              ],
            );
            await this.pool.query(
              `
              INSERT INTO marketplace.listing_status (listing_id, from_status, to_status, reason, actor_id)
              VALUES ($1, NULL, 'active', 'published', $2)
              `,
              [listingId, ctx.actorId ?? null],
            );
            await this.pool.query(
              `
              INSERT INTO marketplace.listing_metrics (listing_id) VALUES ($1)
              ON CONFLICT DO NOTHING
              `,
              [listingId],
            );
            await appendDomainEvent(this.pool, {
              eventType: "MarketplaceListingCreated",
              aggregateType: "listing",
              aggregateId: listingId,
              payload: {
                sellerId: ctx.sellerId,
                productVariantId: ctx.productVariantId,
                priceCents: ctx.priceCents,
                stock: ctx.stock,
                condition: ctx.condition,
              },
              metadata: { requestId: ctx.requestId, correlationId },
            });
            return { listingId };
          },
          compensate: async (ctx) => {
            if (!ctx.listingId) return;
            await this.pool.query(
              `UPDATE marketplace.listings SET status = 'paused', updated_at = now() WHERE id = $1`,
              [ctx.listingId],
            );
            await this.pool.query(
              `INSERT INTO marketplace.listing_status (listing_id, from_status, to_status, reason)
               VALUES ($1,'active','paused','saga_compensate')`,
              [ctx.listingId],
            );
          },
        },
        {
          name: "InventoryUpsert",
          execute: async (ctx) => {
            const stockUnitId = await inventory.upsertStock({
              storeId: ctx.sellerId,
              subjectType: "product_variant",
              subjectId: ctx.productVariantId,
              condition: ctx.condition,
              onHand: ctx.stock,
              requestId: ctx.requestId,
            });
            if (ctx.listingId) {
              await this.pool.query(
                `UPDATE marketplace.listings SET inventory_stock_unit_id = $2, updated_at = now() WHERE id = $1`,
                [ctx.listingId, stockUnitId],
              );
            }
            return { stockUnitId };
          },
        },
        {
          name: "PricingRefresh",
          execute: async (ctx) => {
            const valuation = await pricing.syncSubject({
              requestId: ctx.requestId,
              subjectType: "product_variant",
              subjectId: ctx.productVariantId,
              currency: "BRL",
            });
            return {
              suggestedPriceCents: valuation.suggestedPriceCents,
              pricingConfidence: valuation.confidence,
            };
          },
          optional: true,
        },
        {
          name: "SearchReindex",
          execute: async (ctx) => {
            // Enqueue search sync command — Marketplace does not talk to Meilisearch directly
            await appendDomainEvent(this.pool, {
              eventType: "MarketplaceListingPublished",
              aggregateType: "listing",
              aggregateId: String(ctx.listingId),
              payload: {
                productVariantId: ctx.productVariantId,
                sellerId: ctx.sellerId,
                action: "search.reindex",
              },
              metadata: { requestId: ctx.requestId, correlationId },
            });
            return { searchEnqueued: true };
          },
          optional: true,
        },
        {
          name: "AnalyticsIngest",
          execute: async (ctx) => {
            await appendDomainEvent(this.pool, {
              eventType: "MarketplaceListingPublished",
              aggregateType: "listing",
              aggregateId: String(ctx.listingId),
              payload: {
                productVariantId: ctx.productVariantId,
                action: "analytics.ingest",
                priceCents: ctx.priceCents,
              },
              metadata: { requestId: ctx.requestId, correlationId },
            });
            await this.pool.query(
              `
              INSERT INTO marketplace.seller_metrics (seller_id, active_listings, updated_at)
              VALUES ($1, 1, now())
              ON CONFLICT (seller_id) DO UPDATE SET
                active_listings = marketplace.seller_metrics.active_listings + 1,
                updated_at = now()
              `,
              [ctx.sellerId],
            );
            return { analyticsIngested: true };
          },
          optional: true,
        },
        {
          name: "NotificationPublish",
          execute: async (ctx) => {
            await appendDomainEvent(this.pool, {
              eventType: "NotificationRequested",
              aggregateType: "listing",
              aggregateId: String(ctx.listingId),
              payload: {
                channel: "webhook",
                template: "listing_published",
                productVariantId: ctx.productVariantId,
              },
              metadata: { requestId: ctx.requestId, correlationId },
            });
            return { notificationQueued: true };
          },
          optional: true,
        },
      ],
    };

    const initial: ListingSagaContext = {
      requestId: cmd.requestId,
      sellerId: cmd.sellerId,
      productVariantId: cmd.productVariantId,
      priceCents: cmd.priceCents,
      stock: cmd.stock,
      condition: cmd.condition,
      currency: cmd.currency ?? "BRL",
      actorId: cmd.actorId,
    };

    const result = await saga.run(definition, initial, {
      correlationId,
      requestId: cmd.requestId,
    });

    log.info(
      { sagaId: result.sagaId, status: result.status, listingId: result.context.listingId },
      "publish_product_listing_done",
    );

    return {
      listingId: String(result.context.listingId ?? ""),
      sagaId: result.sagaId,
      status: result.status,
      stockUnitId: result.context.stockUnitId
        ? String(result.context.stockUnitId)
        : undefined,
      error: result.error,
    };
  }
}

export function createMarketplaceOrchestrator(pool: Pool): MarketplaceOrchestrator {
  return new MarketplaceOrchestrator(pool);
}
