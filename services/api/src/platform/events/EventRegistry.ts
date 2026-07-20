/**
 * ADR-010 — Event Registry (immutable versions).
 */
export interface EventSchemaRegistration {
  eventType: string;
  version: number;
  description: string;
  /** Compatibility note — never mutate registered payload meaning. */
  frozen: true;
  payloadKeys?: string[];
}

function normalizeKey(eventType: string, version: number): string {
  if (/\.v\d+$/.test(eventType)) return eventType;
  return `${eventType}.v${version}`;
}

const CORE_EVENTS: EventSchemaRegistration[] = [
  { eventType: "PriceChanged.v1", version: 1, description: "Aggregated price valuation updated", frozen: true, payloadKeys: ["min", "avg", "median", "suggested"] },
  { eventType: "StockChanged.v1", version: 1, description: "Inventory on_hand changed", frozen: true },
  { eventType: "InventoryReserved.v1", version: 1, description: "Stock reserved", frozen: true },
  { eventType: "InventoryReleased.v1", version: 1, description: "Reservation released", frozen: true },
  { eventType: "MarketplaceListingCreated.v1", version: 1, description: "Listing row created", frozen: true },
  { eventType: "MarketplaceListingPublished.v1", version: 1, description: "Listing published / side-effects", frozen: true },
  { eventType: "MarketplaceListingUpdated.v1", version: 1, description: "Listing updated (legacy card path)", frozen: true },
  { eventType: "ListingPublished.v1", version: 1, description: "Alias for published listing", frozen: true },
  { eventType: "SagaCompleted.v1", version: 1, description: "Saga finished successfully", frozen: true },
  { eventType: "SagaFailed.v1", version: 1, description: "Saga failed after compensate", frozen: true },
  { eventType: "NotificationRequested.v1", version: 1, description: "Notification requested", frozen: true },
  { eventType: "CardUpdated.v1", version: 1, description: "Catalog card upserted", frozen: true },
  { eventType: "SetUpdated.v1", version: 1, description: "Catalog set upserted", frozen: true },
  { eventType: "VariantUpdated.v1", version: 1, description: "Catalog variant upserted", frozen: true },
  { eventType: "MediaUpdated.v1", version: 1, description: "Media asset updated", frozen: true },
  { eventType: "AssetCreated.v1", version: 1, description: "Asset ingested", frozen: true },
  { eventType: "ProductCreated.v1", version: 1, description: "Master catalog product", frozen: true },
  { eventType: "ProductImported.v1", version: 1, description: "Product import upsert", frozen: true },
  { eventType: "CheckoutStarted.v1", version: 1, description: "Checkout V2 session started", frozen: true, payloadKeys: ["cartId", "buyerId", "totalCents"] },
  { eventType: "CheckoutCompleted.v1", version: 1, description: "Checkout V2 payment confirmed and inventory confirmed", frozen: true, payloadKeys: ["buyerId", "sessionId", "totalCents"] },
  { eventType: "PaymentApproved.v1", version: 1, description: "Payment intent succeeded / Payment recorded", frozen: true, payloadKeys: ["paymentIntentId", "sessionId"] },
  { eventType: "InventoryConfirmed.v1", version: 1, description: "Reservations confirmed after payment", frozen: true, payloadKeys: ["reservationIds", "sessionId"] },
  { eventType: "OrderCreated.v1", version: 1, description: "Order created from checkout session", frozen: true, payloadKeys: ["buyerId", "checkoutSessionId", "totalAmountCents"] },
  { eventType: "OrderPaid.v1", version: 1, description: "Order payment confirmed", frozen: true, payloadKeys: ["buyerId", "totalAmountCents"] },
  { eventType: "OrderProcessing.v1", version: 1, description: "Order preparing shipment", frozen: true },
  { eventType: "OrderShipped.v1", version: 1, description: "Order shipped", frozen: true },
  { eventType: "OrderDelivered.v1", version: 1, description: "Order delivered", frozen: true },
  { eventType: "OrderCancelled.v1", version: 1, description: "Order cancelled", frozen: true },
  { eventType: "OrderRefundRequested.v1", version: 1, description: "Refund requested", frozen: true },
  { eventType: "OrderRefunded.v1", version: 1, description: "Order refunded", frozen: true },
];

export class EventRegistry {
  private readonly byKey = new Map<string, EventSchemaRegistration>();

  constructor(seed: EventSchemaRegistration[] = CORE_EVENTS) {
    for (const s of seed) this.register(s);
  }

  register(schema: EventSchemaRegistration): void {
    const k = normalizeKey(schema.eventType, schema.version);
    const next: EventSchemaRegistration = { ...schema, eventType: k, frozen: true };
    const existing = this.byKey.get(k);
    if (existing) {
      if (
        existing.description !== next.description ||
        JSON.stringify(existing.payloadKeys ?? null) !== JSON.stringify(next.payloadKeys ?? null)
      ) {
        throw new Error(`event_schema_immutable:${k}`);
      }
      return;
    }
    this.byKey.set(k, next);
  }

  isRegistered(eventType: string, version?: number): boolean {
    const v = version ?? parseInt(eventType.match(/\.v(\d+)$/)?.[1] ?? "1", 10);
    return this.byKey.has(normalizeKey(eventType, v));
  }

  get(eventType: string, version?: number): EventSchemaRegistration | undefined {
    const v = version ?? parseInt(eventType.match(/\.v(\d+)$/)?.[1] ?? "1", 10);
    return this.byKey.get(normalizeKey(eventType, v));
  }

  list(): EventSchemaRegistration[] {
    return [...this.byKey.values()];
  }
}

export const eventRegistry = new EventRegistry();
