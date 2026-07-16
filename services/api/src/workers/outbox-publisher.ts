/**
 * Outbox Publisher process — lease + SKIP LOCKED + EventPublisher.
 *
 * Env:
 *   DATABASE_URL   — Postgres (required)
 *   REDIS_URL      — Redis Streams (required)
 *   OUTBOX_WORKER_ID — default hostname
 *   OUTBOX_LEASE_MS — default 30000
 *   OUTBOX_BATCH_SIZE — default 20
 *   OUTBOX_POLL_MS — default 1000
 */
import { hostname } from "node:os";
import { Pool } from "pg";
import { Redis } from "ioredis";
import { createLogger } from "../platform/logging/logger.js";
import { PostgresOutboxRepository } from "../platform/outbox/PostgresOutboxRepository.js";
import { OutboxPublisherWorker } from "../platform/outbox/OutboxPublisherWorker.js";
import { RedisEventPublisher } from "../platform/event-publisher/RedisEventPublisher.js";

const log = createLogger("outbox-publisher-main");

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  const redisUrl = process.env.REDIS_URL ?? "redis://127.0.0.1:6379";
  if (!databaseUrl) {
    throw new Error("DATABASE_URL required for outbox publisher");
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const redis = new Redis(redisUrl, { maxRetriesPerRequest: null });
  const outbox = new PostgresOutboxRepository(pool);
  const publisher = new RedisEventPublisher(redis);
  const worker = new OutboxPublisherWorker(outbox, publisher, {
    workerId: process.env.OUTBOX_WORKER_ID ?? `outbox-${hostname()}`,
    leaseMs: Number(process.env.OUTBOX_LEASE_MS ?? 30_000),
    batchSize: Number(process.env.OUTBOX_BATCH_SIZE ?? 20),
    pollIntervalMs: Number(process.env.OUTBOX_POLL_MS ?? 1_000),
  });

  worker.start();
  log.info("outbox_publisher_process_running");

  const shutdown = async () => {
    worker.stop();
    await pool.end();
    redis.disconnect();
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown());
  process.on("SIGTERM", () => void shutdown());
}

main().catch((err) => {
  log.error({ err: String(err) }, "outbox_publisher_boot_failed");
  process.exit(1);
});
