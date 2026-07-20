import type { Pool } from "pg";
import type { PlatformDomainEvent } from "../events/DomainEvent.js";
import type { ProjectionConsumer } from "./ProjectionWorker.js";
import { createOrdersProjectionConsumers } from "../../orders/projections/OrdersProjections.js";
import { CreateOrderFromCheckoutProjection } from "../../orders/projections/CreateOrderFromCheckoutProjection.js";

/** Seller dashboard MV — listens to listing/inventory events only. */
export class SellerDashboardProjection implements ProjectionConsumer {
  readonly name = "SellerDashboardProjection";

  constructor(private readonly pool: Pool) {}

  supports(event: PlatformDomainEvent): boolean {
    return (
      event.eventType.startsWith("MarketplaceListing") ||
      event.eventType.startsWith("StockChanged") ||
      event.eventType.startsWith("InventoryReserved")
    );
  }

  async project(event: PlatformDomainEvent): Promise<void> {
    const sellerId =
      (event.payload as { sellerId?: string }).sellerId ??
      (event.aggregateType === "seller" ? event.aggregateId : null);
    if (!sellerId) return;
    await this.pool.query(
      `
      INSERT INTO analytics.mv_seller_dashboard (seller_id, active_listings, updated_at)
      VALUES ($1, 0, now())
      ON CONFLICT (seller_id) DO UPDATE SET updated_at = now()
      `,
      [sellerId],
    );
  }
}

export class LowestPriceProjection implements ProjectionConsumer {
  readonly name = "LowestPriceProjection";

  constructor(private readonly pool: Pool) {}

  supports(event: PlatformDomainEvent): boolean {
    return event.eventType.startsWith("PriceChanged") || event.eventType.startsWith("MarketplaceListing");
  }

  async project(event: PlatformDomainEvent): Promise<void> {
    const p = event.payload as {
      productVariantId?: string;
      min?: number;
      priceCents?: number;
    };
    const subjectId = p.productVariantId ?? event.aggregateId;
    const min = p.min ?? p.priceCents;
    if (min == null) return;
    await this.pool.query(
      `
      INSERT INTO analytics.mv_lowest_prices (subject_type, subject_id, min_price_cents, listing_count, updated_at)
      VALUES ('product_variant', $1, $2, 1, now())
      ON CONFLICT (subject_type, subject_id, currency) DO UPDATE SET
        min_price_cents = LEAST(analytics.mv_lowest_prices.min_price_cents, EXCLUDED.min_price_cents),
        listing_count = analytics.mv_lowest_prices.listing_count + 1,
        updated_at = now()
      `,
      [subjectId, min],
    );
  }
}

/** Search projection stub — enqueues intent only (no Meili writes from other BCs). */
export class SearchProjection implements ProjectionConsumer {
  readonly name = "SearchProjection";
  readonly seen: PlatformDomainEvent[] = [];

  supports(event: PlatformDomainEvent): boolean {
    return (
      event.eventType.startsWith("MarketplaceListing") ||
      event.eventType.startsWith("CardUpdated") ||
      event.eventType.startsWith("VariantUpdated")
    );
  }

  async project(event: PlatformDomainEvent): Promise<void> {
    this.seen.push(event);
  }
}

export class AnalyticsProjection implements ProjectionConsumer {
  readonly name = "AnalyticsProjection";
  readonly seen: PlatformDomainEvent[] = [];

  supports(_event: PlatformDomainEvent): boolean {
    return true; // ingest all — filter internally
  }

  async project(event: PlatformDomainEvent): Promise<void> {
    this.seen.push(event);
  }
}

/** Default set including Orders projections + Checkout→Order handoff. */
export function createDefaultBusinessProjections(pool: Pool): ProjectionConsumer[] {
  return [
    new SellerDashboardProjection(pool),
    new LowestPriceProjection(pool),
    new SearchProjection(),
    new AnalyticsProjection(),
    new CreateOrderFromCheckoutProjection(pool),
    ...createOrdersProjectionConsumers(pool),
  ];
}
