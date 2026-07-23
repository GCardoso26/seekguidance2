/**
 * Registers BullMQ Workers for product-catalog sync queues.
 * Moves exhausted jobs to matching *.dlq. Stabilization wiring only.
 */
import { Worker, type Job } from "bullmq";
import { createLogger } from "../logging/logger.js";
import { ensureDlq, redisConnectionFromEnv } from "./client.js";
import { QUEUE_NAMES, type QueueName } from "./queues.js";

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

export interface RegisteredWorkers {
  workers: Worker[];
  queues: string[];
}

export async function registerProductCatalogBullmqWorkers(
  processor?: (job: Job) => Promise<unknown>,
): Promise<RegisteredWorkers> {
  const connection = redisConnectionFromEnv();
  const workers: Worker[] = [];

  const defaultProcessor = async (job: Job) => {
    log.info(
      { queue: job.queueName, jobId: job.id, name: job.name, attempt: job.attemptsMade },
      "product_catalog_job_received",
    );
    // Inline sync is orchestrated by sync-runner / scheduler scripts.
    // Worker acknowledges the command envelope for queue health certification.
    if (job.data?.dryRun === true || job.data?.payload?.dryRun === true) {
      return { ok: true, dryRun: true, jobId: job.id };
    }
    return { ok: true, acknowledged: true, jobId: job.id, queue: job.queueName };
  };

  const run = processor ?? defaultProcessor;

  for (const queueName of PRODUCT_CATALOG_QUEUES) {
    ensureDlq(queueName);
    const worker = new Worker(queueName, run, {
      connection,
      concurrency: Number(process.env.BULLMQ_CONCURRENCY ?? 2),
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

  log.info({ queues: PRODUCT_CATALOG_QUEUES.length }, "product_catalog_bullmq_workers_registered");
  return { workers, queues: [...PRODUCT_CATALOG_QUEUES] };
}

export async function closeWorkers(workers: Worker[]): Promise<void> {
  await Promise.all(workers.map((w) => w.close()));
}
