import type { JobEnvelope } from "../../platform/jobs/JobEnvelope.js";
import { createLogger } from "../../platform/logging/logger.js";
import { isSyncVariantCommand } from "../commands/SyncVariantCommand.js";
import type { PersistCatalogVariantApplicationService } from "../application/PersistCatalogVariantApplicationService.js";

const log = createLogger("processor.sync-variant");

/** Thin adapter — JobEnvelope → PersistCatalogVariantApplicationService. */
export function createSyncVariantProcessor(app: PersistCatalogVariantApplicationService) {
  return async (envelope: JobEnvelope, ctx: { jobId: string }): Promise<void> => {
    if (!isSyncVariantCommand(envelope)) {
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
      "sync_variant_command",
    );
    await app.execute({
      requestId: envelope.requestId,
      correlationId: envelope.correlationId,
      provider: envelope.providerId,
      variant: envelope.payload.variant,
      mapping: envelope.payload.mapping,
    });
  };
}
