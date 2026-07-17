/**
 * CLI — Lorcana dataset seed (Release 1 beachhead / P0).
 * Persists cards.json → Catalog → Outbox (no scrape, no cron).
 *
 * Usage:
 *   DATABASE_URL=... npm run sync:lorcana:seed
 *   DATABASE_URL=... npm run sync:lorcana:seed -- TFC
 *
 * Optional: REDIS_URL for Outbox → Search worker.
 */
import { Pool } from "pg";
import { Redis } from "ioredis";
import { InMemoryEventPublisher } from "../platform/event-publisher/EventPublisher.js";
import { RedisEventPublisher } from "../platform/event-publisher/RedisEventPublisher.js";
import { createLogger } from "../platform/logging/logger.js";
import { createPostgresCatalogStack } from "../catalog/persistence/createPostgresCatalogStack.js";
import { LorcanaProvider } from "../catalog/providers/lorcana/LorcanaProvider.js";
import { listSets, loadLorcanaDataset } from "../catalog/providers/lorcana/DatasetLoader.js";
import { bootstrapLorcanaRegistry } from "../catalog/services/CatalogSyncService.js";
import { runScryfallShadowSync } from "../catalog/sync/ScryfallShadowSync.js";

const log = createLogger("cli.lorcana-seed");

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL ?? process.env.CONTRACT_DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL required");
    process.exit(1);
  }

  bootstrapLorcanaRegistry();
  loadLorcanaDataset();

  const onlySet = process.argv[2]?.toUpperCase();
  const sets = listSets().filter((s) => !onlySet || s.code.toUpperCase() === onlySet);
  if (sets.length === 0) {
    console.error(onlySet ? `set_not_in_dataset:${onlySet}` : "lorcana_dataset_empty_sets");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: url });
  const stack = createPostgresCatalogStack(pool);
  const provider = new LorcanaProvider();

  let publisher = new InMemoryEventPublisher() as InMemoryEventPublisher | RedisEventPublisher;
  let redis: Redis | undefined;
  if (process.env.REDIS_URL) {
    redis = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null });
    publisher = new RedisEventPublisher(redis);
    log.info("publisher=redis");
  } else {
    log.info("publisher=inmemory (set REDIS_URL so Search worker can project)");
  }

  const reports = [];
  try {
    for (const set of sets) {
      log.info({ setCode: set.code }, "lorcana_seed_set_start");
      const report = await runScryfallShadowSync(
        {
          pool,
          provider,
          persistSet: stack.apps.persistSet,
          persistCard: stack.apps.persistCard,
          persistVariant: stack.apps.persistVariant,
          sets: stack.sets,
          cards: stack.cards,
          variants: stack.variants,
          mappings: stack.mappings,
          outbox: stack.outbox,
          publisher,
        },
        {
          setCode: set.code,
          processJobs: process.env.SHADOW_PROCESS_JOBS !== "0",
          publishOutbox: process.env.SHADOW_PUBLISH !== "0",
          full: true,
        },
      );
      reports.push(report);
      if (!report.consistencyPassed) {
        console.error(JSON.stringify(report, null, 2));
        console.error(`ConsistencyValidator failed for set ${set.code}`);
        process.exit(2);
      }
    }
    console.log(
      JSON.stringify(
        {
          ok: true,
          beachhead: "LORCANA",
          providerId: "lorcana-dataset",
          sets: reports.map((r) => ({
            setCode: r.setCode,
            cardsEnqueued: r.counters.cardsEnqueued,
            variantsEnqueued: r.counters.variantsEnqueued,
            outboxPublished: r.counters.outboxPublished,
          })),
        },
        null,
        2,
      ),
    );
  } finally {
    await pool.end();
    if (redis) await redis.quit();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
