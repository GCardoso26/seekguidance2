import type { Pool, PoolClient } from "pg";
import type { DomainEvent } from "../../shared/events/types.js";
import type { InsertOutboxInput, OutboxRecord, OutboxRepository, OutboxStatus } from "./types.js";

type Queryable = Pool | PoolClient;

/**
 * PostgreSQL Outbox — claim uses FOR UPDATE SKIP LOCKED.
 * Caller must run insert() inside the same DB transaction as domain writes.
 */
export class PostgresOutboxRepository implements OutboxRepository {
  constructor(private readonly db: Queryable) {}

  async insert(input: InsertOutboxInput): Promise<OutboxRecord> {
    const id = input.id ?? input.event.id ?? crypto.randomUUID();
    const event: DomainEvent = { ...input.event, id };
    const maxAttempts = input.maxAttempts ?? 5;

    const res = await this.db.query(
      `
      INSERT INTO platform.outbox_events (
        id, aggregate_type, aggregate_id, event_name, event_version, schema_version,
        payload, status, attempts, max_attempts, request_id, trace_id,
        correlation_id, causation_id, projection_version
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7::jsonb,'pending',0,$8,$9,$10,$11,$12,$13
      )
      RETURNING *
      `,
      [
        id,
        event.aggregateType,
        event.aggregateId,
        event.eventType,
        event.eventVersion,
        event.schemaVersion,
        JSON.stringify(event),
        maxAttempts,
        event.requestId,
        event.traceId ?? null,
        event.correlationId,
        event.causationId ?? null,
        event.projectionVersion ?? null,
      ],
    );
    return mapRow(res.rows[0]);
  }

  async claimBatch(opts: {
    workerId: string;
    leaseMs: number;
    limit: number;
    now?: Date;
  }): Promise<OutboxRecord[]> {
    const now = opts.now ?? new Date();
    const leaseUntil = new Date(now.getTime() + opts.leaseMs);

    const res = await this.db.query(
      `
      WITH cte AS (
        SELECT id
        FROM platform.outbox_events
        WHERE (
          status = 'pending' AND (next_retry_at IS NULL OR next_retry_at <= $1)
        ) OR (
          status = 'leased' AND lease_until IS NOT NULL AND lease_until <= $1
        )
        ORDER BY created_at ASC
        FOR UPDATE SKIP LOCKED
        LIMIT $2
      )
      UPDATE platform.outbox_events o
      SET status = 'leased',
          leased_by = $3,
          lease_until = $4
      FROM cte
      WHERE o.id = cte.id
      RETURNING o.*
      `,
      [now.toISOString(), opts.limit, opts.workerId, leaseUntil.toISOString()],
    );
    return res.rows.map(mapRow);
  }

  async markPublished(id: string, publishedAt = new Date()): Promise<void> {
    await this.db.query(
      `
      UPDATE platform.outbox_events
      SET status = 'published',
          published_at = $2,
          leased_by = NULL,
          lease_until = NULL,
          last_error = NULL
      WHERE id = $1 AND status <> 'published'
      `,
      [id, publishedAt.toISOString()],
    );
  }

  async markPublishFailed(id: string, error: string, now = new Date()): Promise<OutboxRecord> {
    const res = await this.db.query(
      `
      UPDATE platform.outbox_events
      SET attempts = attempts + 1,
          last_error = $2,
          leased_by = NULL,
          lease_until = NULL,
          status = CASE
            WHEN attempts + 1 >= max_attempts THEN 'dead'
            ELSE 'pending'
          END,
          next_retry_at = CASE
            WHEN attempts + 1 >= max_attempts THEN NULL
            ELSE $3::timestamptz + (LEAST(60, POWER(2, attempts)) || ' seconds')::interval
          END
      WHERE id = $1
      RETURNING *
      `,
      [id, error, now.toISOString()],
    );
    if (!res.rows[0]) throw new Error(`outbox_not_found:${id}`);
    return mapRow(res.rows[0]);
  }

  async countByStatus(status: OutboxStatus): Promise<number> {
    const res = await this.db.query(
      `SELECT COUNT(*)::int AS c FROM platform.outbox_events WHERE status = $1`,
      [status],
    );
    return res.rows[0]?.c ?? 0;
  }

  async oldestPendingAgeSeconds(now = new Date()): Promise<number | null> {
    const res = await this.db.query(
      `
      SELECT EXTRACT(EPOCH FROM ($1::timestamptz - MIN(created_at))) AS age
      FROM platform.outbox_events
      WHERE status IN ('pending', 'leased')
      `,
      [now.toISOString()],
    );
    const age = res.rows[0]?.age;
    return age === null || age === undefined ? null : Number(age);
  }

  async getById(id: string): Promise<OutboxRecord | null> {
    const res = await this.db.query(`SELECT * FROM platform.outbox_events WHERE id = $1`, [id]);
    return res.rows[0] ? mapRow(res.rows[0]) : null;
  }
}

function mapRow(row: Record<string, unknown>): OutboxRecord {
  const payload =
    typeof row.payload === "string" ? (JSON.parse(row.payload) as DomainEvent) : (row.payload as DomainEvent);
  return {
    id: String(row.id),
    aggregateType: String(row.aggregate_type),
    aggregateId: String(row.aggregate_id),
    eventName: String(row.event_name),
    eventVersion: Number(row.event_version),
    schemaVersion: Number(row.schema_version),
    payload,
    status: row.status as OutboxStatus,
    attempts: Number(row.attempts),
    maxAttempts: Number(row.max_attempts),
    nextRetryAt: row.next_retry_at ? new Date(String(row.next_retry_at)) : null,
    leaseUntil: row.lease_until ? new Date(String(row.lease_until)) : null,
    leasedBy: row.leased_by ? String(row.leased_by) : null,
    publishedAt: row.published_at ? new Date(String(row.published_at)) : null,
    createdAt: new Date(String(row.created_at)),
    requestId: row.request_id ? String(row.request_id) : null,
    traceId: row.trace_id ? String(row.trace_id) : null,
    correlationId: String(row.correlation_id),
    causationId: row.causation_id ? String(row.causation_id) : null,
    projectionVersion: row.projection_version ? String(row.projection_version) : null,
    lastError: row.last_error ? String(row.last_error) : null,
  };
}
