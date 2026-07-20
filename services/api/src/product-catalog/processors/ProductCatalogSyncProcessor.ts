import type { JobEnvelope } from "../../platform/jobs/JobEnvelope.js";
import { createLogger } from "../../platform/logging/logger.js";
import { Pool } from "pg";
import { isProductCatalogSyncCommand } from "../commands/ProductCatalogSyncCommand.js";
import { ProductCatalogSyncService } from "../application/ProductCatalogSyncService.js";
import { PostgresProductCatalogRepository } from "../persistence/PostgresProductCatalogRepository.js";
import { providersForJob } from "../providers/registry.js";

const log = createLogger("processor.product-catalog");

export function createProductCatalogSyncProcessor(pool: Pool) {
  const repo = new PostgresProductCatalogRepository(pool);
  const service = new ProductCatalogSyncService(repo, pool);
  return async (envelope: JobEnvelope, ctx: { jobId: string }): Promise<void> => {
    if (!isProductCatalogSyncCommand(envelope)) {
      throw new Error(`unexpected_job_type:${envelope.jobType}`);
    }
    const { jobKey, mode, dryRun } = envelope.payload;
    log.info({ jobId: ctx.jobId, jobKey, mode, requestId: envelope.requestId }, "product_catalog_command");
    await service.runJob(jobKey, providersForJob(jobKey), {
      requestId: envelope.requestId,
      mode,
      dryRun,
    });
  };
}
