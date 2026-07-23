/**
 * Registers BullMQ Workers for product-catalog sync queues.
 * Moves exhausted jobs to matching *.dlq.
 * Processors run ProductCatalogSyncService for real (not ACK-only).
 */
import { Worker, type Job } from "bullmq";
import type { Pool } from "pg";
import { Pool as PgPool } from "pg";
import { createLogger } from "../logging/logger.js";
import { ensureDlq, redisConnectionFromEnv } from "./client.js";
import { QUEUE_NAMES, type QueueName } from "./queues.js";
import { executeProductCatalogSyncJob } from "../../product-catalog/cli/runProductCatalogSync.js";
import type { ProductCatalogJobKey } from "../../product-catalog/providers/ProductCatalogProvider.js";
import { listProductCatalogJobs } from "../../product-catalog/providers/registry.js";
import type { ProductCatalogSyncCommandPayload } from "../../product-catalog/commands/ProductCatalogSyncCommand.js";

const log = createLogger("bullmq.workers");

const PRODUCT_CATALOG_QUEUES: QueueName[] = [
  QUEUE_NAMES.productCatalogSealed,
  QUEUE_NAMES.productCatalogSleeves,
  QUEUE_NAMES.productCatalogDeckboxes,
  QUEUE_NAMES.productCatalogBinders,
  QUEUE_NAMES.productCatalogPages,
  QUEUE_NAMES.productCatalogDice,
  QUEUE_NAMES.productCatalogCounters,
  QUEUE_NAMES.productCatalogPlaymats,
];

const VALID_JOBS = new Set(listProductCatalogJobs());

export interface RegisteredWorkers {
  workers: Worker[];
  queues: string[];
}

function resolveJobKey(job: Job): ProductCatalogJobKey {
  const data = job.data as {
    payload?: ProductCatalogSyncCommandPayload;
    jobKey?: string;
  };
  const fromPayload = data?.payload?.jobKey ?? data?.jobKey;
  if (fromPayload && VALID_JOBS.has(fromPayload as ProductCatalogJobKey)) {
    return fromPayload as ProductCatalogJobKey;
  }
  if (VALID_JOBS.has(job.queueName as ProductCatalogJobKey)) {
    return job.queueName as ProductCatalogJobKey;
  }
  throw new Error(`unknown_product_catalog_job:${job.queueName}`);
}

function resolveMode(job: Job): "full" | "incremental" {
  const data = job.data as { payload?: ProductCatalogSyncCommandPayload; mode?: string };
  const mode = data?.payload?.mode ?? data?.mode;
  return mode === "full" ? "full" : "incremental";
}

function resolveDryRun(job: Job): boolean {
  const data = job.data as { payload?: ProductCatalogSyncCommandPayload; dryRun?: boolean };
  return data?.payload?.dryRun === true || data?.dryRun === true;
}

function pgUrl(raw: string): string {
  return raw.replace(/^postgresql\+asyncpg:/, "postgresql:");
}

export async function registerProductCatalogBullmqWorkers(
  processor?: (job: Job) => Promise<unknown>,
  opts?: { pool?: Pool },
): Promise<RegisteredWorkers> {
  const connection = redisConnectionFromEnv();
  const workers: Worker[] = [];

  const ownPool = !opts?.pool;
  const databaseUrl = process.env.DATABASE_URL;
  if (!opts?.pool && !databaseUrl) {
    throw new Error("DATABASE_URL required for product catalog BullMQ workers");
  }
  const pool = opts?.pool ?? new PgPool({ connectionString: pgUrl(databaseUrl!) });

  const defaultProcessor = async (job: Job) => {
    const jobKey = resolveJobKey(job);
    const dryRun = resolveDryRun(job);
    const mode = resolveMode(job);

    log.info(
      { queue: job.queueName, jobId: job.id, jobKey, mode, dryRun, attempt: job.attemptsMade },
      "product_catalog_job_received",
    );

    if (dryRun) {
      return { ok: true, dryRun: true, jobId: job.id, jobKey };
    }

    const result = await executeProductCatalogSyncJob(jobKey, { mode, dryRun: false, pool });
    if (!result.ok) {
      const hard = result.errors.filter((e) => !e.startsWith("image:") && !e.startsWith("knowledge:"));
      if (hard.length) {
        throw new Error(`product_catalog_sync_failed:${jobKey}:${hard.slice(0, 3).join("|")}`);
      }
    }
    return {
      ok: result.ok,
      jobId: job.id,
      jobKey,
      upserted: result.upserted,
      errorCount: result.errors.length,
    };
  };

  const run = processor ?? defaultProcessor;

  for (const queueName of PRODUCT_CATALOG_QUEUES) {
    ensureDlq(queueName);
    const worker = new Worker(queueName, run, {
      connection,
      concurrency: Number(process.env.BULLMQ_CONCURRENCY ?? 1),
    });

    worker.on("failed", async (job, err) => {
      if (!job) return;
      const maxAttempts = job.opts.attempts ?? 5;
      if (job.attemptsMade >= maxAttempts) {
        const dlq = ensureDlq(queueName as QueueName);
        await dlq.add(
          `${job.name}:dead`,
          {
            originalJobId: job.id,
            queue: queueName,
            failedReason: err?.message ?? String(err),
            data: job.data,
            attemptsMade: job.attemptsMade,
          },
          { removeOnComplete: 100, removeOnFail: 100 },
        );
        log.warn(
          { queue: queueName, jobId: job.id, attemptsMade: job.attemptsMade },
          "job_moved_to_dlq",
        );
      }
    });

    workers.push(worker);
  }

  if (ownPool) {
    const shutdown = async () => {
      await closeWorkers(workers);
      await pool.end();
    };
    process.once("SIGINT", () => void shutdown());
    process.once("SIGTERM", () => void shutdown());
  }

  log.info({ queues: PRODUCT_CATALOG_QUEUES.length }, "product_catalog_bullmq_workers_registered");
  return { workers, queues: [...PRODUCT_CATALOG_QUEUES] };
}

export async function closeWorkers(workers: Worker[]): Promise<void> {
  await Promise.all(workers.map((w) => w.close()));
}
