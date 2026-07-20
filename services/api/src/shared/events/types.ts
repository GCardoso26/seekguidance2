import { getClock } from "../time/Clock.js";
import { getIdGenerator } from "../ids/IdGenerator.js";

/** Shared domain event envelope (v1.2.7 — EventMetadata nested). */
export type DomainEventName =
  | "CardUpdated"
  | "SetUpdated"
  | "VariantUpdated"
  | "MediaUpdated"
  | "PriceUpdated"
  | "PriceChanged"
  | "StockChanged"
  | "CurrencyUpdated"
  | "MarketplaceListingUpdated"
  | "MarketplaceListingCreated"
  | "MarketplaceListingPublished"
  | "NotificationRequested"
  | "SagaCompleted"
  | "SagaFailed"
  | "ProviderHealthChanged"
  | "SyncStarted"
  | "CartCreated"
  | "CartItemAdded"
  | "CheckoutStarted"
  | "CheckoutCompleted"
  | "InventoryReserved"
  | "InventoryConfirmed"
  | "ReservationHeld"
  | "ReservationRejected"
  | "ReservationConfirmed"
  | "ReservationReleased"
  | "ReservationExpired"
  | "PaymentRequested"
  | "PaymentApproved"
  | "PaymentDeclined"
  | "PaymentFailed"
  | "PaymentCancelled"
  | "OrderCreated"
  | "OrderPaid"
  | "OrderProcessing"
  | "OrderShipped"
  | "OrderDelivered"
  | "OrderCancelled"
  | "OrderRefundRequested"
  | "OrderRefunded"
  | "OrderCompleted";

/**
 * Cross-cutting event metadata — stable for Webhooks / Kafka / Replay / CDC / Audit.
 * Prefer evolving this object over adding top-level fields to every event.
 */
export interface EventMetadata {
  requestId: string;
  traceId?: string;
  correlationId: string;
  causationId?: string;
  /** Changes when event SEMANTICS change. */
  eventVersion: number;
  /** Changes when only serialized payload FORMAT changes. */
  schemaVersion: number;
  projectionVersion?: string;
  /** Service / bounded context that produced the event. */
  producer?: string;
  occurredAt: string;
}

export interface DomainEvent<TPayload = Record<string, unknown>> {
  /** Stable id of this event instance (equals outbox row id when persisted). */
  id?: string;
  eventType: DomainEventName;
  aggregateType: string;
  aggregateId: string;
  metadata: EventMetadata;
  payload: TPayload;
}

/** @deprecated Prefer reading `event.metadata` — flat accessors kept for gradual migration. */
export function eventVersion(event: DomainEvent): number {
  return event.metadata.eventVersion;
}

export function eventCorrelationId(event: DomainEvent): string {
  return event.metadata.correlationId;
}

export function eventOccurredAt(event: DomainEvent): string {
  return event.metadata.occurredAt;
}

export interface CreateDomainEventOpts {
  eventVersion?: number;
  schemaVersion?: number;
  aggregateType?: string;
  requestId?: string;
  traceId?: string;
  correlationId?: string;
  causationId?: string;
  projectionVersion?: string;
  producer?: string;
  occurredAt?: string;
  id?: string;
  metadata?: Partial<EventMetadata>;
}

export function createDomainEvent<TPayload extends Record<string, unknown>>(
  eventType: DomainEventName,
  aggregateId: string,
  payload: TPayload,
  opts?: CreateDomainEventOpts,
): DomainEvent<TPayload> {
  const requestId = opts?.metadata?.requestId ?? opts?.requestId ?? getIdGenerator().generate();
  const metadata: EventMetadata = {
    requestId,
    traceId: opts?.metadata?.traceId ?? opts?.traceId,
    correlationId:
      opts?.metadata?.correlationId ?? opts?.correlationId ?? requestId,
    causationId: opts?.metadata?.causationId ?? opts?.causationId,
    eventVersion: opts?.metadata?.eventVersion ?? opts?.eventVersion ?? 1,
    schemaVersion: opts?.metadata?.schemaVersion ?? opts?.schemaVersion ?? 1,
    projectionVersion: opts?.metadata?.projectionVersion ?? opts?.projectionVersion,
    producer: opts?.metadata?.producer ?? opts?.producer,
    occurredAt: opts?.metadata?.occurredAt ?? opts?.occurredAt ?? getClock().nowIso(),
  };
  return {
    id: opts?.id,
    eventType,
    aggregateType: opts?.aggregateType ?? "unknown",
    aggregateId,
    metadata,
    payload,
  };
}
