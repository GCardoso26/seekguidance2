import { eventBus } from "../../platform/event-bus/EventBus.js";
import { createLogger } from "../../platform/logging/logger.js";
import type { DomainEvent } from "../../shared/events/types.js";

const log = createLogger("analytics");

/**
 * Phase 1: append-only analytics_events buffer (in-memory).
 * Later: persist → aggregators → daily_prices / market_trends / …
 */
export class AnalyticsEventIngestor {
  private buffer: DomainEvent[] = [];
  private unsubscribe?: () => void;

  start(): void {
    this.unsubscribe = eventBus.subscribe("*", (event: DomainEvent) => {
      this.buffer.push(event);
      log.debug({ event: event.event, version: event.version }, "analytics_event_buffered");
    });
  }

  stop(): void {
    this.unsubscribe?.();
  }

  size(): number {
    return this.buffer.length;
  }

  drain(): DomainEvent[] {
    const out = this.buffer;
    this.buffer = [];
    return out;
  }
}

export const analyticsIngestor = new AnalyticsEventIngestor();
