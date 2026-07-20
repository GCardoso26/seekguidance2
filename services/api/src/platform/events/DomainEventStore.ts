import type { Pool, PoolClient } from "pg";

export type DomainEventType =
  | "ProductCreated"
  | "VariantCreated"
  | "PriceChanged"
  | "StockChanged"
  | "ProductImported"
  | "AssetCreated"
  | "CollectionCreated"
  | "ProductRevised"
  | "InventoryReserved"
  | "InventoryReleased"
  | "MarketplaceListingCreated"
  | "MarketplaceListingPublished"
  | "NotificationRequested"
  | "SagaCompleted"
  | "SagaFailed";

export interface AppendDomainEventInput {
  eventType: DomainEventType | string;
  aggregateType: string;
  aggregateId: string;
  payload?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  eventVersion?: number;
}

/** Event sourcing leve — append-only em platform.domain_events. */
export async function appendDomainEvent(
  db: Pool | PoolClient,
  input: AppendDomainEventInput,
): Promise<string> {
  const res = await db.query<{ id: string }>(
    `
    INSERT INTO platform.domain_events (
      event_type, aggregate_type, aggregate_id, event_version, payload, metadata
    ) VALUES ($1,$2,$3,$4,$5::jsonb,$6::jsonb)
    RETURNING id
    `,
    [
      input.eventType,
      input.aggregateType,
      input.aggregateId,
      input.eventVersion ?? 1,
      JSON.stringify(input.payload ?? {}),
      JSON.stringify(input.metadata ?? {}),
    ],
  );
  return res.rows[0]!.id;
}

export async function listDomainEvents(
  db: Pool | PoolClient,
  opts: { aggregateType?: string; aggregateId?: string; eventType?: string; limit?: number },
): Promise<Record<string, unknown>[]> {
  const clauses: string[] = ["1=1"];
  const params: unknown[] = [];
  if (opts.aggregateType) {
    params.push(opts.aggregateType);
    clauses.push(`aggregate_type = $${params.length}`);
  }
  if (opts.aggregateId) {
    params.push(opts.aggregateId);
    clauses.push(`aggregate_id = $${params.length}`);
  }
  if (opts.eventType) {
    params.push(opts.eventType);
    clauses.push(`event_type = $${params.length}`);
  }
  params.push(opts.limit ?? 50);
  const res = await db.query(
    `SELECT * FROM platform.domain_events WHERE ${clauses.join(" AND ")}
     ORDER BY occurred_at DESC LIMIT $${params.length}`,
    params,
  );
  return res.rows;
}
