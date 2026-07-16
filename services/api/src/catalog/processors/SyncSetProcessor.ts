import type { JobEnvelope } from "../../platform/jobs/JobEnvelope.js";
import { createLogger } from "../../platform/logging/logger.js";
import { isSyncSetCommand } from "../commands/SyncSetCommand.js";
import type { PersistCatalogSetApplicationService } from "../application/PersistCatalogSetApplicationService.js";

const log = createLogger("processor.sync-set");

/**
 * Thin adapter — deserialize JobEnvelope → Application Service.
 * No domain rules here.
 */
export function createSyncSetProcessor(app: PersistCatalogSetApplicationService) {
  return async (envelope: JobEnvelope, ctx: { jobId: string }): Promise<void> => {
    if (!isSyncSetCommand(envelope)) {
      throw new Error(`unexpected_job_type:${envelope.jobType}`);
    }
    const { payload } = envelope;
    log.info(
      {
        jobId: ctx.jobId,
        requestId: envelope.requestId,
        correlationId: envelope.correlationId,
        providerId: envelope.providerId,
        gameCode: envelope.gameCode,
        attempt: envelope.attempt,
      },
      "sync_set_command",
    );
    await app.execute({
      requestId: envelope.requestId,
      correlationId: envelope.correlationId,
      provider: envelope.providerId,
      set: {
        gameId: payload.gameId,
        code: payload.code,
        name: payload.name,
        releaseDate: payload.releaseDate,
      },
      providerSetId: payload.providerSetId,
      mappingMetadata: payload.mappingMetadata,
    });
  };
}
