/** Shared domain event envelope (v1.2.4 definitive). */
export type DomainEventName =
  | "CardUpdated"
  | "SetUpdated"
  | "VariantUpdated"
  | "MediaUpdated"
  | "PriceUpdated"
  | "CurrencyUpdated"
  | "MarketplaceListingUpdated"
  | "ProviderHealthChanged"
  | "SyncStarted";

/**
 * eventVersion — changes when event SEMANTICS change.
 * schemaVersion — changes when only serialized payload FORMAT changes.
 */
export interface DomainEvent<TPayload = Record<string, unknown>> {
  /** Stable id of this event instance (equals outbox row id when persisted). */
  id?: string;
  eventType: DomainEventName;
  eventVersion: number;
  schemaVersion: number;
  aggregateType: string;
  aggregateId: string;
  occurredAt: string;
  requestId: string;
  traceId?: string;
  correlationId: string;
  causationId?: string;
  projectionVersion?: string;
  payload: TPayload;
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
  occurredAt?: string;
  id?: string;
}

export function createDomainEvent<TPayload extends Record<string, unknown>>(
  eventType: DomainEventName,
  aggregateId: string,
  payload: TPayload,
  opts?: CreateDomainEventOpts,
): DomainEvent<TPayload> {
  const requestId = opts?.requestId ?? crypto.randomUUID();
  return {
    id: opts?.id,
    eventType,
    eventVersion: opts?.eventVersion ?? 1,
    schemaVersion: opts?.schemaVersion ?? 1,
    aggregateType: opts?.aggregateType ?? "unknown",
    aggregateId,
    occurredAt: opts?.occurredAt ?? new Date().toISOString(),
    requestId,
    traceId: opts?.traceId,
    correlationId: opts?.correlationId ?? requestId,
    causationId: opts?.causationId,
    projectionVersion: opts?.projectionVersion,
    payload,
  };
}
