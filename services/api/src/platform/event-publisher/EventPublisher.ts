import type { DomainEvent } from "../../shared/events/types.js";

/**
 * Port — Outbox Publisher depends on this, never on Redis directly.
 */
export interface EventPublisher {
  publish(event: DomainEvent): Promise<void>;
}

/** Test / local adapter — records published event ids for idempotency assertions. */
export class InMemoryEventPublisher implements EventPublisher {
  readonly published: DomainEvent[] = [];
  readonly publishedIds = new Set<string>();
  failNext = false;

  async publish(event: DomainEvent): Promise<void> {
    if (this.failNext) {
      this.failNext = false;
      throw new Error("publisher_forced_failure");
    }
    const id = event.id;
    if (id && this.publishedIds.has(id)) {
      // Idempotent re-publish of same event id — no duplicate fan-out record
      return;
    }
    if (id) this.publishedIds.add(id);
    this.published.push(structuredClone(event));
  }
}
