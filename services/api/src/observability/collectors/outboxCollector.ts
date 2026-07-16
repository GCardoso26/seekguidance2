import type { OutboxRepository } from "../../platform/outbox/types.js";
import { domainMetrics } from "../metrics/domainMetrics.js";

/**
 * Collects Outbox gauges for Prometheus scrape (Sprint 6).
 * Call before /metrics or on a timer.
 */
export async function collectOutboxMetrics(outbox: OutboxRepository): Promise<void> {
  const pending = await outbox.countByStatus("pending");
  const leased = await outbox.countByStatus("leased");
  const dead = await outbox.countByStatus("dead");
  domainMetrics.outboxPending(pending + leased);
  domainMetrics.outboxDead(dead);
  // Age: approximate 0 when empty; real PG collector can refine.
  domainMetrics.outboxOldestAge(pending + leased > 0 ? 1 : 0);
}
