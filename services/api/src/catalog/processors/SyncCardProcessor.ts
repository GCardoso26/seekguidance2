import type { JobEnvelope } from "../../platform/jobs/JobEnvelope.js";
import { createLogger } from "../../platform/logging/logger.js";
import { isSyncCardCommand } from "../commands/SyncCardCommand.js";
import type { PersistCatalogCardApplicationService } from "../application/PersistCatalogCardApplicationService.js";

const log = createLogger("processor.sync-card");

/** Thin adapter — JobEnvelope → PersistCatalogCardApplicationService. */
export function createSyncCardProcessor(app: PersistCatalogCardApplicationService) {
  return async (envelope: JobEnvelope, ctx: { jobId: string }): Promise<void> => {
    if (!isSyncCardCommand(envelope)) {
      throw new Error(`unexpected_job_type:${envelope.jobType}`);
    }
    log.info(
      {
        jobId: ctx.jobId,
        requestId: envelope.requestId,
        correlationId: envelope.correlationId,
        providerId: envelope.providerId,
        gameCode: envelope.gameCode,
        attempt: envelope.attempt,
      },
      "sync_card_command",
    );
    await app.execute({
      requestId: envelope.requestId,
      correlationId: envelope.correlationId,
      provider: envelope.providerId,
      card: envelope.payload.card,
      mapping: envelope.payload.mapping,
    });
  };
}
