import type { DomainEvent, DomainEventName } from "../../shared/events/types.js";

export type EventHandler = (event: DomainEvent) => Promise<void> | void;

/**
 * In-process pub/sub Event Bus (Phase 1).
 * Producers never know consumers. Swap for Redis Streams in later phases.
 */
export class EventBus {
  private readonly handlers = new Map<DomainEventName | "*", Set<EventHandler>>();

  subscribe(event: DomainEventName | "*", handler: EventHandler): () => void {
    const set = this.handlers.get(event) ?? new Set();
    set.add(handler);
    this.handlers.set(event, set);
    return () => set.delete(handler);
  }

  async publish(event: DomainEvent): Promise<void> {
    const specific = this.handlers.get(event.event) ?? new Set();
    const wildcard = this.handlers.get("*") ?? new Set();
    const all = [...specific, ...wildcard];
    await Promise.all(all.map((h) => Promise.resolve(h(event))));
  }
}

export const eventBus = new EventBus();
