import type { Pool } from "pg";
import { randomUUID } from "node:crypto";
import { createLogger } from "../../platform/logging/logger.js";
import { ProductCatalogSyncService } from "../application/ProductCatalogSyncService.js";
import { createCatalogPgPool } from "../persistence/createCatalogPgPool.js";
import { PostgresProductCatalogRepository } from "../persistence/PostgresProductCatalogRepository.js";
import type { ProductCatalogJobKey } from "../providers/ProductCatalogProvider.js";
import { providersForJob } from "../providers/registry.js";

const log = createLogger("cli.product-catalog");

export type ProductCatalogSyncJobResult = {
  ok: boolean;
  upserted: number;
  errors: string[];
};

/**
 * Executes a product-catalog sync job and returns the result (no process.exit).
 * Used by CLI, BullMQ workers, and cron entrypoints.
 */
export async function executeProductCatalogSyncJob(
  jobKey: ProductCatalogJobKey,
  opts: {
    mode?: "full" | "incremental";
    dryRun?: boolean;
    syncSince?: string;
    pool?: Pool;
  } = {},
): Promise<ProductCatalogSyncJobResult> {
  const ownPool = !opts.pool;
  const pool = opts.pool ?? createCatalogPgPool({ max: 3 });
  try {
    const repo = new PostgresProductCatalogRepository(pool);
    const service = new ProductCatalogSyncService(repo, pool);
    const providers = providersForJob(jobKey);
    const requestId = randomUUID();
    log.info(
      { jobKey, providers: providers.map((p) => p.providerId), requestId },
      "product_catalog_sync_start",
    );
    const result = await service.runJob(jobKey, providers, {
      requestId,
      mode: opts.mode ?? "incremental",
      dryRun: opts.dryRun,
      syncSince: opts.syncSince,
    });
    log.info({ jobKey, ...result }, "product_catalog_sync_done");
    return result;
  } finally {
    if (ownPool) await pool.end();
  }
}

/** CLI entry — sets process.exitCode on soft failure. */
export async function runProductCatalogSyncJob(
  jobKey: ProductCatalogJobKey,
  opts: { mode?: "full" | "incremental"; dryRun?: boolean; syncSince?: string } = {},
): Promise<void> {
  const result = await executeProductCatalogSyncJob(jobKey, opts);
  if (!result.ok) {
    process.exitCode = 1;
  }
}
