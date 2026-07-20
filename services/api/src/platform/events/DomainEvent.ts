/**
 * ADR-008 — Canonical Domain Event contract.
 * All platform events MUST conform to this shape.
 */
export interface PlatformDomainEvent<T = unknown> {
  eventId: string;
  /** Versioned type, e.g. PriceChanged.v1 */
  eventType: string;
  aggregateId: string;
  aggregateType: string;
  /** Semantic version of this event type (matches .vN suffix). */
  version: number;
  occurredAt: Date;
  correlationId: string;
  causationId?: string;
  actor?: string;
  tenantId?: string;
  payload: T;
}

export interface CreatePlatformEventInput<T = unknown> {
  eventType: string;
  aggregateId: string;
  aggregateType: string;
  payload: T;
  version?: number;
  correlationId?: string;
  causationId?: string;
  actor?: string;
  tenantId?: string;
  eventId?: string;
  occurredAt?: Date;
}
