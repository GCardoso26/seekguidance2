/** Shared domain event envelope (versioned). */
export type DomainEventName =
  | "CardUpdated"
  | "SetUpdated"
  | "VariantUpdated"
  | "MediaUpdated"
  | "PriceUpdated"
  | "CurrencyUpdated"
  | "MarketplaceListingUpdated"
  | "ProviderHealthChanged";

export interface DomainEvent<TPayload = Record<string, unknown>> {
  event: DomainEventName;
  version: number;
  aggregateId: string;
  occurredAt: string;
  requestId: string;
  payload: TPayload;
}

export function createDomainEvent<TPayload extends Record<string, unknown>>(
  event: DomainEventName,
  aggregateId: string,
  payload: TPayload,
  opts?: { version?: number; requestId?: string; occurredAt?: string },
): DomainEvent<TPayload> {
  return {
    event,
    version: opts?.version ?? 1,
    aggregateId,
    occurredAt: opts?.occurredAt ?? new Date().toISOString(),
    requestId: opts?.requestId ?? crypto.randomUUID(),
    payload,
  };
}
