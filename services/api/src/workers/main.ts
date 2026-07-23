import {
  bootstrapScryfallRegistry,
  bootstrapLorcanaRegistry,
  bootstrapPokemonRegistry,
} from "../catalog/services/CatalogSyncService.js";
import { analyticsIngestor } from "../analytics/consumers/AnalyticsEventIngestor.js";
import { searchSyncWorker } from "../search/SearchSyncWorker.js";
import { createLogger } from "../platform/logging/logger.js";
import { allPrimaryQueues } from "../platform/bullmq/client.js";
import { QUEUE_NAMES, dlqName } from "../platform/bullmq/queues.js";
import { registerProductCatalogBullmqWorkers } from "../platform/bullmq/registerProductCatalogWorkers.js";

const log = createLogger("workers");

async function main(): Promise<void> {
  bootstrapScryfallRegistry();
  bootstrapLorcanaRegistry();
  bootstrapPokemonRegistry();
  searchSyncWorker.start();
  analyticsIngestor.start();

  const attachBullmq = process.env.WORKER_IDLE === "0" || process.env.BULLMQ_WORKERS === "1";
  if (attachBullmq) {
    const registered = await registerProductCatalogBullmqWorkers();
    log.info({ bullmqQueues: registered.queues.length }, "bullmq_workers_attached");
  }

  log.info(
    {
      queues: allPrimaryQueues(),
      sampleDlq: dlqName(QUEUE_NAMES.catalogCards),
      projection: searchSyncWorker.getProjection(),
      beachhead: "LORCANA",
      r2Providers: ["MTG:scryfall", "POKEMON:pokemon-dataset"],
      bullmqAttached: attachBullmq,
    },
    "domain_workers_started",
  );

  if (!attachBullmq) {
    log.info("worker_idle_ok — set BULLMQ_WORKERS=1 or WORKER_IDLE=0 to attach processors");
  }
}

main().catch((err) => {
  log.error({ err: String(err) }, "workers_boot_failed");
  process.exit(1);
});
