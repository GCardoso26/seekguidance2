import type { DomainEvent } from "../../shared/events/types.js";
import type { TxParticipant } from "../transaction/InMemoryTransactionManager.js";
import type { TxContext } from "../transaction/types.js";
import type { InsertOutboxInput, OutboxRecord, OutboxRepository, OutboxStatus } from "./types.js";

/**
 * In-memory Outbox with SKIP LOCKED–like claim semantics for unit tests.
 * Does not require PostgreSQL. Implements TxParticipant for rollback with InMemoryTransactionManager.
 */
export class InMemoryOutboxRepository implements OutboxRepository, TxParticipant {
  private rows = new Map<string, OutboxRecord>();
  private snapshots = new Map<string, Map<string, OutboxRecord>>();
  private mutex: Promise<void> = Promise.resolve();

  beginTx(txId: string): void {
    this.snapshots.set(txId, cloneMap(this.rows));
  }

  commitTx(txId: string): void {
    this.snapshots.delete(txId);
  }

  rollbackTx(txId: string): void {
    const snap = this.snapshots.get(txId);
    if (snap) this.rows = snap;
    this.snapshots.delete(txId);
  }

  private async withLock<T>(fn: () => T | Promise<T>): Promise<T> {
    let release!: () => void;
    const next = new Promise<void>((r) => {
      release = r;
    });
    const prev = this.mutex;
    this.mutex = prev.then(() => next);
    await prev;
    try {
      return await fn();
    } finally {
      release();
    }
  }

  async insert(_tx: TxContext, input: InsertOutboxInput): Promise<OutboxRecord> {
    return this.withLock(() => {
      const id = input.id ?? input.event.id ?? crypto.randomUUID();
      if (this.rows.has(id)) {
        throw new Error(`outbox_duplicate_id:${id}`);
      }
      const event: DomainEvent = { ...input.event, id };
      const meta = event.metadata;
      const now = new Date();
      const record: OutboxRecord = {
        id,
        aggregateType: event.aggregateType,
        aggregateId: event.aggregateId,
        eventName: event.eventType,
        eventVersion: meta.eventVersion,
        schemaVersion: meta.schemaVersion,
        payload: structuredClone(event),
        status: "pending",
        attempts: 0,
        maxAttempts: input.maxAttempts ?? 5,
        nextRetryAt: null,
        leaseUntil: null,
        leasedBy: null,
        publishedAt: null,
        committedAt: now,
        createdAt: now,
        requestId: meta.requestId,
        traceId: meta.traceId ?? null,
        correlationId: meta.correlationId,
        causationId: meta.causationId ?? null,
        projectionVersion: meta.projectionVersion ?? null,
        lastError: null,
      };
      this.rows.set(id, record);
      return structuredClone(record);
    });
  }

  async claimBatch(opts: {
    workerId: string;
    leaseMs: number;
    limit: number;
    now?: Date;
  }): Promise<OutboxRecord[]> {
    return this.withLock(() => {
      const now = opts.now ?? new Date();
      const claimed: OutboxRecord[] = [];
      const candidates = [...this.rows.values()]
        .filter((r) => isClaimable(r, now))
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

      for (const row of candidates) {
        if (claimed.length >= opts.limit) break;
        row.status = "leased";
        row.leasedBy = opts.workerId;
        row.leaseUntil = new Date(now.getTime() + opts.leaseMs);
        claimed.push(structuredClone(row));
      }
      return claimed;
    });
  }

  async markPublished(id: string, publishedAt = new Date()): Promise<void> {
    return this.withLock(() => {
      const row = this.rows.get(id);
      if (!row) throw new Error(`outbox_not_found:${id}`);
      if (row.status === "published") return; // idempotent
      row.status = "published";
      row.publishedAt = publishedAt;
      row.leasedBy = null;
      row.leaseUntil = null;
      row.lastError = null;
    });
  }

  async markPublishFailed(id: string, error: string, now = new Date()): Promise<OutboxRecord> {
    return this.withLock(() => {
      const row = this.rows.get(id);
      if (!row) throw new Error(`outbox_not_found:${id}`);
      row.attempts += 1;
      row.lastError = error;
      row.leasedBy = null;
      row.leaseUntil = null;
      if (row.attempts >= row.maxAttempts) {
        row.status = "dead";
        row.nextRetryAt = null;
      } else {
        row.status = "pending";
        const backoffMs = Math.min(60_000, 1_000 * 2 ** (row.attempts - 1));
        row.nextRetryAt = new Date(now.getTime() + backoffMs);
      }
      return structuredClone(row);
    });
  }

  async countByStatus(status: OutboxStatus): Promise<number> {
    return [...this.rows.values()].filter((r) => r.status === status).length;
  }

  async oldestPendingAgeSeconds(now = new Date()): Promise<number | null> {
    const pending = [...this.rows.values()]
      .filter((r) => r.status === "pending" || r.status === "leased")
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    if (!pending.length) return null;
    return (now.getTime() - pending[0]!.createdAt.getTime()) / 1000;
  }

  async getById(id: string): Promise<OutboxRecord | null> {
    const row = this.rows.get(id);
    return row ? structuredClone(row) : null;
  }

  /** Test helper — mutate payload must be impossible via public API; expose for immutability test. */
  tryUpdatePayload(id: string, _payload: DomainEvent): never {
    throw new Error(`outbox_payload_immutable:${id}`);
  }

  all(): OutboxRecord[] {
    return [...this.rows.values()].map((r) => structuredClone(r));
  }
}

function isClaimable(r: OutboxRecord, now: Date): boolean {
  if (r.status === "pending") {
    if (r.nextRetryAt && r.nextRetryAt > now) return false;
    return true;
  }
  if (r.status === "leased" && r.leaseUntil && r.leaseUntil <= now) return true;
  return false;
}

function cloneMap(src: Map<string, OutboxRecord>): Map<string, OutboxRecord> {
  const out = new Map<string, OutboxRecord>();
  for (const [k, v] of src) out.set(k, structuredClone(v));
  return out;
}
