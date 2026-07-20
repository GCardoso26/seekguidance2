import { Pool } from "pg";
import { randomUUID } from "node:crypto";
import { createLogger } from "../../platform/logging/logger.js";
import { ProductCatalogSyncService } from "../application/ProductCatalogSyncService.js";
import { PostgresProductCatalogRepository } from "../persistence/PostgresProductCatalogRepository.js";
import type { ProductCatalogJobKey } from "../providers/ProductCatalogProvider.js";
import { providersForJob } from "../providers/registry.js";

const log = createLogger("cli.product-catalog");

export async function runProductCatalogSyncJob(
  jobKey: ProductCatalogJobKey,
  opts: { mode?: "full" | "incremental"; dryRun?: boolean; syncSince?: string } = {},
): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL required for product catalog sync");
  }
  const pool = new Pool({ connectionString: databaseUrl });
  const repo = new PostgresProductCatalogRepository(pool);
  const service = new ProductCatalogSyncService(repo, pool);
  const providers = providersForJob(jobKey);
  const requestId = randomUUID();
  log.info({ jobKey, providers: providers.map((p) => p.providerId), requestId }, "product_catalog_sync_start");
  const result = await service.runJob(jobKey, providers, {
    requestId,
    mode: opts.mode ?? "incremental",
    dryRun: opts.dryRun,
    syncSince: opts.syncSince,
  });
  log.info({ jobKey, ...result }, "product_catalog_sync_done");
  await pool.end();
  if (!result.ok) {
    process.exitCode = 1;
  }
}
