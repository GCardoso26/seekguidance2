import { bootstrapScryfallRegistry, bootstrapLorcanaRegistry } from "../catalog/services/CatalogSyncService.js";
import { analyticsIngestor } from "../analytics/consumers/AnalyticsEventIngestor.js";
import { searchSyncWorker } from "../search/SearchSyncWorker.js";
import { createLogger } from "../platform/logging/logger.js";
import { allPrimaryQueues } from "../platform/bullmq/client.js";
import { QUEUE_NAMES, dlqName } from "../platform/bullmq/queues.js";

const log = createLogger("workers");

async function main(): Promise<void> {
  bootstrapScryfallRegistry();
  bootstrapLorcanaRegistry();
  searchSyncWorker.start();
  analyticsIngestor.start();

  log.info(
    {
      queues: allPrimaryQueues(),
      sampleDlq: dlqName(QUEUE_NAMES.catalogCards),
      projection: searchSyncWorker.getProjection(),
      beachhead: "LORCANA",
    },
    "domain_workers_started",
  );

  // BullMQ Worker processors are registered per-queue in later wiring.
  // Phase 1 boots registry + event consumers so the process is healthy.
  if (process.env.WORKER_IDLE !== "0") {
    log.info("worker_idle_ok — set WORKER_IDLE=0 when processors are attached");
  }
}

main().catch((err) => {
  log.error({ err: String(err) }, "workers_boot_failed");
  process.exit(1);
});
