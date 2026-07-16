import type { Redis } from "ioredis";
import type { DomainEvent } from "../../shared/events/types.js";
import type { EventPublisher } from "./EventPublisher.js";

export const DOMAIN_EVENTS_STREAM = "judgetcg:domain-events";

/**
 * Redis Streams adapter for EventPublisher.
 */
export class RedisEventPublisher implements EventPublisher {
  constructor(
    private readonly redis: Redis,
    private readonly stream = DOMAIN_EVENTS_STREAM,
  ) {}

  async publish(event: DomainEvent): Promise<void> {
    const id = event.id ?? crypto.randomUUID();
    await this.redis.xadd(
      this.stream,
      "*",
      "event_id",
      id,
      "event_type",
      event.eventType,
      "correlation_id",
      event.metadata.correlationId,
      "body",
      JSON.stringify({ ...event, id }),
    );
  }
}
