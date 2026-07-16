import { createLogger } from "../logging/logger.js";
import { metrics } from "../metrics/registry.js";
import type { EventPublisher } from "../event-publisher/EventPublisher.js";
import type { OutboxRepository } from "./types.js";

const log = createLogger("outbox-publisher");

export interface OutboxPublisherWorkerOptions {
  workerId: string;
  leaseMs?: number;
  batchSize?: number;
  pollIntervalMs?: number;
}

/**
 * Polls committed outbox rows, leases them, publishes via EventPublisher.
 * Only sees rows after COMMIT (Postgres MVCC / in-memory after insert returns).
 */
export class OutboxPublisherWorker {
  private running = false;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly outbox: OutboxRepository,
    private readonly publisher: EventPublisher,
    private readonly opts: OutboxPublisherWorkerOptions,
  ) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    const interval = this.opts.pollIntervalMs ?? 1_000;
    void this.tick();
    this.timer = setInterval(() => void this.tick(), interval);
    log.info({ workerId: this.opts.workerId }, "outbox_publisher_started");
  }

  stop(): void {
    this.running = false;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  /** Single poll cycle — exposed for tests. */
  async tick(): Promise<{ claimed: number; published: number; dead: number }> {
    if (!this.running && this.timer === null) {
      // allow manual tick in tests without start()
    }
    const leaseMs = this.opts.leaseMs ?? 30_000;
    const limit = this.opts.batchSize ?? 10;
    let published = 0;
    let dead = 0;

    const claimed = await this.outbox.claimBatch({
      workerId: this.opts.workerId,
      leaseMs,
      limit,
    });

    for (const row of claimed) {
      const started = Date.now();
      try {
        await this.publisher.publish(row.payload);
        await this.outbox.markPublished(row.id);
        published += 1;
        metrics.inc("outbox_published_total");
        metrics.observe("outbox_publish_duration_seconds", (Date.now() - started) / 1000);
        log.debug(
          {
            jobId: row.id,
            requestId: row.requestId,
            eventType: row.eventName,
            correlationId: row.correlationId,
          },
          "outbox_published",
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const updated = await this.outbox.markPublishFailed(row.id, message);
        if (updated.status === "dead") {
          dead += 1;
          metrics.inc("outbox_dead_total");
          log.error({ eventId: row.id, err: message }, "outbox_dead");
        } else {
          log.warn(
            { eventId: row.id, attempts: updated.attempts, err: message },
            "outbox_retry_scheduled",
          );
        }
      }
    }

    await this.refreshGauges();
    return { claimed: claimed.length, published, dead };
  }

  private async refreshGauges(): Promise<void> {
    const pending = await this.outbox.countByStatus("pending");
    const leased = await this.outbox.countByStatus("leased");
    metrics.setGauge("outbox_backlog", pending + leased);
    const age = await this.outbox.oldestPendingAgeSeconds();
    if (age !== null) {
      metrics.setGauge("outbox_oldest_pending_age_seconds", age);
    }
  }
}
