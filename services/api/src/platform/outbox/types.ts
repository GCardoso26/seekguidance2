import type { DomainEvent } from "../../shared/events/types.js";
import type { TxContext } from "../transaction/types.js";

export type OutboxStatus = "pending" | "leased" | "published" | "dead";

export interface OutboxRecord {
  id: string;
  aggregateType: string;
  aggregateId: string;
  eventName: string;
  eventVersion: number;
  schemaVersion: number;
  /** Immutable DomainEvent envelope snapshot. */
  payload: DomainEvent;
  status: OutboxStatus;
  attempts: number;
  maxAttempts: number;
  nextRetryAt: Date | null;
  leaseUntil: Date | null;
  leasedBy: string | null;
  /** Domain fact time is in payload.metadata.occurredAt */
  publishedAt: Date | null;
  /** TX commit / outbox insert time */
  committedAt: Date;
  createdAt: Date;
  requestId: string | null;
  traceId: string | null;
  correlationId: string;
  causationId: string | null;
  projectionVersion: string | null;
  lastError: string | null;
}

export interface InsertOutboxInput {
  id?: string;
  event: DomainEvent;
  maxAttempts?: number;
}

export interface OutboxRepository {
  /**
   * Insert within caller's transaction (`tx`).
   * Application Service decides to insert; TransactionManager does not know Outbox.
   * Payload must never be updated later.
   */
  insert(tx: TxContext, input: InsertOutboxInput): Promise<OutboxRecord>;

  /**
   * Claim next claimable rows (pending, or expired lease, or retry-ready).
   * Implementations MUST use SKIP LOCKED semantics (or equivalent).
   */
  claimBatch(opts: {
    workerId: string;
    leaseMs: number;
    limit: number;
    now?: Date;
  }): Promise<OutboxRecord[]>;

  markPublished(id: string, publishedAt?: Date): Promise<void>;

  /**
   * On failure: increment attempts; if >= max → dead; else pending + next_retry_at.
   */
  markPublishFailed(id: string, error: string, now?: Date): Promise<OutboxRecord>;

  countByStatus(status: OutboxStatus): Promise<number>;

  oldestPendingAgeSeconds(now?: Date): Promise<number | null>;

  getById(id: string): Promise<OutboxRecord | null>;
}
