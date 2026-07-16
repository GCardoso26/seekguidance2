import type { DomainEvent } from "../../shared/events/types.js";
import type { ConsumerOffsetRepository } from "./ConsumerOffsetRepository.js";

/**
 * Idempotent consumer helper — skip if already processed.
 */
export async function processOnce(
  offsets: ConsumerOffsetRepository,
  consumerName: string,
  event: DomainEvent,
  handler: (event: DomainEvent) => Promise<void>,
): Promise<"success" | "skipped" | "failed"> {
  const eventId = event.id;
  if (!eventId) throw new Error("event_missing_id");

  if (await offsets.hasProcessed(consumerName, eventId)) {
    return "skipped";
  }

  const started = Date.now();
  try {
    await handler(event);
    await offsets.record({
      consumerName,
      eventId,
      result: "success",
      processingDurationMs: Date.now() - started,
    });
    return "success";
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await offsets.record({
      consumerName,
      eventId,
      result: "failed",
      processingDurationMs: Date.now() - started,
      lastError: message,
    });
    return "failed";
  }
}
