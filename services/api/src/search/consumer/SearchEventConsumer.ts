import type { DomainEvent } from "../../shared/events/types.js";
import type { ConsumerOffsetRepository } from "../../platform/outbox/ConsumerOffsetRepository.js";
import { createLogger } from "../../platform/logging/logger.js";
import { getClock } from "../../shared/time/Clock.js";
import { ApplySearchEventApplicationService } from "../application/ApplySearchEventApplicationService.js";
import type { SearchProjectionRepository } from "../domain/SearchProjectionRepository.js";
import type { ProjectionManager } from "../ProjectionManager.js";

const log = createLogger("search-consumer");

export const SEARCH_CONSUMER_NAME = "search-projection";

/**
 * Search Event Consumer — thin adapter: offsets + ApplySearchEvent.
 * Index lifecycle lives in ProjectionManager — not here.
 */
export class SearchEventConsumer {
  private readonly app: ApplySearchEventApplicationService;

  constructor(
    private readonly projection: SearchProjectionRepository,
    private readonly offsets: ConsumerOffsetRepository,
    private readonly consumerName = SEARCH_CONSUMER_NAME,
    projectionManager?: ProjectionManager,
  ) {
    this.app = new ApplySearchEventApplicationService(projection, { projectionManager });
  }

  async handle(event: DomainEvent): Promise<"applied" | "skipped" | "ignored" | "failed"> {
    const eventId =
      event.id ?? `${event.eventType}:${event.aggregateId}:${event.metadata.occurredAt}`;
    const t0 = getClock().nowMs();

    try {
      if (await this.offsets.hasProcessed(this.consumerName, eventId)) {
        await this.offsets.record({
          consumerName: this.consumerName,
          eventId,
          result: "skipped",
          processingDurationMs: getClock().nowMs() - t0,
        });
        return "skipped";
      }

      const result = await this.app.execute(event);
      await this.offsets.record({
        consumerName: this.consumerName,
        eventId,
        result: result === "applied" ? "success" : "skipped",
        processingDurationMs: getClock().nowMs() - t0,
      });
      if (result === "applied") {
        log.debug(
          {
            eventType: event.eventType,
            aggregateId: event.aggregateId,
            projection: this.projection.getVersion().name,
          },
          "search_doc_upsert",
        );
      }
      return result === "applied" ? "applied" : "ignored";
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await this.offsets.record({
        consumerName: this.consumerName,
        eventId,
        result: "failed",
        processingDurationMs: getClock().nowMs() - t0,
        lastError: message,
      });
      log.error({ eventId, err: message }, "search_consume_failed");
      return "failed";
    }
  }
}
