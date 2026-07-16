/**
 * CLI — Scryfall SHADOW sync (Sprint 2).
 * Usage: DATABASE_URL=... npx tsx src/workers/scryfall-shadow.ts [SET_CODE]
 * Default set: lea (small classic) or SCRYFALL_SHADOW_SET env.
 */
import { Pool } from "pg";
import { InMemoryEventPublisher } from "../platform/event-publisher/EventPublisher.js";
import { RedisEventPublisher } from "../platform/event-publisher/RedisEventPublisher.js";
import { createLogger } from "../platform/logging/logger.js";
import { createPostgresCatalogStack } from "../catalog/persistence/createPostgresCatalogStack.js";
import { ScryfallProvider } from "../catalog/providers/magic/ScryfallProvider.js";
import { bootstrapScryfallRegistry } from "../catalog/services/CatalogSyncService.js";
import { runScryfallShadowSync } from "../catalog/sync/ScryfallShadowSync.js";
import { Redis } from "ioredis";

const log = createLogger("cli.scryfall-shadow");

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL ?? process.env.CONTRACT_DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL required");
    process.exit(1);
  }

  bootstrapScryfallRegistry();
  const setCode = (process.argv[2] ?? process.env.SCRYFALL_SHADOW_SET ?? "lea").toLowerCase();
  const pool = new Pool({ connectionString: url });
  const stack = createPostgresCatalogStack(pool);

  let publisher = new InMemoryEventPublisher() as
    | InMemoryEventPublisher
    | RedisEventPublisher;
  let redis: Redis | undefined;
  if (process.env.REDIS_URL) {
    redis = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null });
    publisher = new RedisEventPublisher(redis);
    log.info("publisher=redis");
  } else {
    log.info("publisher=inmemory (set REDIS_URL for Redis Streams)");
  }

  try {
    const report = await runScryfallShadowSync(
      {
        pool,
        provider: new ScryfallProvider(),
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
        setCode,
        processJobs: process.env.SHADOW_PROCESS_JOBS !== "0",
        publishOutbox: process.env.SHADOW_PUBLISH !== "0",
        full: process.env.SHADOW_FULL === "1",
      },
    );

    console.log(JSON.stringify(report, null, 2));
    if (!report.consistencyPassed) {
      console.error("ConsistencyValidator failed");
      process.exit(2);
    }
  } finally {
    await pool.end();
    if (redis) await redis.quit();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
