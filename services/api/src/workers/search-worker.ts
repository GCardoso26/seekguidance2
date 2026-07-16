/**
 * Search worker — Event Bus and/or Redis Streams (Sprint 3.1).
 * REDIS_URL set → XREADGROUP on judgetcg:domain-events.
 */
import { Redis } from "ioredis";
import { Pool } from "pg";
import {
  InMemoryConsumerOffsetRepository,
  type ConsumerOffsetRepository,
} from "../platform/outbox/ConsumerOffsetRepository.js";
import { PostgresConsumerOffsetRepository } from "../platform/outbox/PostgresConsumerOffsetRepository.js";
import { createLogger } from "../platform/logging/logger.js";
import { SearchEventConsumer } from "../search/consumer/SearchEventConsumer.js";
import { RedisSearchStreamConsumer } from "../search/consumer/RedisSearchStreamConsumer.js";
import { searchSyncWorker } from "../search/SearchSyncWorker.js";

const log = createLogger("workers.search");

async function main(): Promise<void> {
  const manager = searchSyncWorker.getManager();
  await manager.ensureIndexes();

  const redisUrl = process.env.REDIS_URL?.trim();
  if (redisUrl) {
    const redis = new Redis(redisUrl, { maxRetriesPerRequest: null });
    let pool: Pool | undefined;
    let offsetRepo: ConsumerOffsetRepository = new InMemoryConsumerOffsetRepository();
    if (process.env.DATABASE_URL) {
      pool = new Pool({ connectionString: process.env.DATABASE_URL });
      offsetRepo = new PostgresConsumerOffsetRepository(pool);
    }

    const consumer = new SearchEventConsumer(
      searchSyncWorker.getRepository(),
      offsetRepo,
      undefined,
      manager,
    );
    const stream = new RedisSearchStreamConsumer({
      redis,
      consumer,
      consumerName: process.env.SEARCH_CONSUMER_NAME ?? `search-${process.pid}`,
    });

    if (process.env.SEARCH_REPLAY === "1") {
      const r = await stream.replay("0");
      log.info(r, "search_replay_complete");
    }

    log.info(
      {
        projection: manager.getLiveVersion(),
        alias: manager.getLiveAlias(),
        mode: "redis-streams",
      },
      "search_worker_started",
    );

    const shutdown = async () => {
      stream.stop();
      await redis.quit();
      await pool?.end();
      process.exit(0);
    };
    process.on("SIGINT", () => void shutdown());
    process.on("SIGTERM", () => void shutdown());

    await stream.start();
    return;
  }

  searchSyncWorker.start();
  const health = await searchSyncWorker.getRepository().getHealth();
  log.info(
    {
      projection: searchSyncWorker.getProjection(),
      alias: manager.getLiveAlias(),
      health: health.status,
      mode: "event-bus",
    },
    "search_worker_started",
  );
}

main().catch((err) => {
  log.error({ err: String(err) }, "search_worker_boot_failed");
  process.exit(1);
});
