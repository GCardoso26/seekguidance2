/**
 * Live BullMQ + Redis certification.
 * Boots redis-memory-server when host Redis is <5 (Windows Redis 3.x cannot run BullMQ).
 */
import "dotenv/config";
import { Redis } from "ioredis";
import { Queue, Worker } from "bullmq";
import { QUEUE_NAMES, dlqName, DEFAULT_JOB_OPTIONS } from "../src/platform/bullmq/queues.js";

interface Check {
  id: string;
  ok: boolean;
  detail: string;
  ms?: number;
}

async function bootCertifiedRedis(): Promise<{
  url: string;
  embedded: boolean;
  version: string;
  stop?: () => Promise<void>;
}> {
  const preferred = process.env.REDIS_URL ?? "redis://127.0.0.1:6379/0";

  async function probe(url: string): Promise<{ ok: boolean; major: number; version: string }> {
    const r = new Redis(url, {
      maxRetriesPerRequest: 1,
      connectTimeout: 1500,
      lazyConnect: true,
      enableOfflineQueue: false,
    });
    try {
      await r.connect();
      const info = await r.info("server");
      const version = /redis_version:([^\r\n]+)/.exec(info)?.[1] ?? "?";
      const major = Number((/redis_version:([0-9]+)/.exec(info) ?? [])[1] ?? 0);
      await r.quit();
      return { ok: true, major, version };
    } catch {
      try {
        r.disconnect();
      } catch {
        /* ignore */
      }
      return { ok: false, major: 0, version: "?" };
    }
  }

  const host = await probe(preferred);
  if (host.ok && host.major >= 5) {
    return { url: preferred, embedded: false, version: host.version };
  }

  console.warn(
    JSON.stringify({
      warn: "redis_incompatible_or_down",
      preferred,
      host,
      action: "starting_redis_memory_server",
    }),
  );

  const { RedisMemoryServer } = await import("redis-memory-server");
  const server = await RedisMemoryServer.create({
    instance: { port: 56379 },
  });
  const h = await server.getHost();
  const p = await server.getPort();
  const url = `redis://${h}:${p}`;
  const embedded = await probe(url);
  if (!embedded.ok || embedded.major < 5) {
    await server.stop();
    throw new Error(
      `embedded_redis_still_incompatible version=${embedded.version} url=${url}`,
    );
  }
  process.env.REDIS_URL = url;
  return {
    url,
    embedded: true,
    version: embedded.version,
    stop: async () => {
      await server.stop();
    },
  };
}

async function main(): Promise<void> {
  const checks: Check[] = [];
  const resolved = await bootCertifiedRedis();
  const { resetRedisConnection, enqueue } = await import("../src/platform/bullmq/client.js");
  await resetRedisConnection();
  process.env.REDIS_URL = resolved.url;

  const t0 = performance.now();
  checks.push({
    id: "redis_ping",
    ok: true,
    detail: `${resolved.url} version=${resolved.version} embedded=${resolved.embedded}`,
    ms: performance.now() - t0,
  });

  const queueName = QUEUE_NAMES.productCatalogSleeves;
  const mkConn = () => new Redis(resolved.url, { maxRetriesPerRequest: null });

  const worker = new Worker(
    queueName,
    async (job) => {
      if (job.name === "fail-cert" || job.data?.forceFail) throw new Error("forced_fail_for_dlq");
      return { ok: true, jobId: job.id };
    },
    { connection: mkConn(), concurrency: 2 },
  );
  await new Promise<void>((r) => worker.once("ready", () => r()));
  await sleep(150);

  const q = new Queue(queueName, { connection: mkConn(), defaultJobOptions: DEFAULT_JOB_OPTIONS });

  const syncJob = await q.add(
    "ProductCatalogSyncCommand",
    { jobType: "ProductCatalogSyncCommand", payload: { jobKey: "catalog.sync.sleeves", dryRun: true } },
    { ...DEFAULT_JOB_OPTIONS },
  );
  checks.push({ id: "enqueue_sleeves", ok: Boolean(syncJob.id), detail: `jobId=${syncJob.id}` });
  const completed = await waitForJob(q, String(syncJob.id), 20_000);
  checks.push({ id: "worker_consume", ok: completed.ok, detail: completed.detail, ms: completed.ms });

  const delayed = await q.add("delayed-cert", { cert: true }, { delay: 400, ...DEFAULT_JOB_OPTIONS });
  const delayedDone = await waitForJob(q, String(delayed.id), 15_000);
  checks.push({ id: "delayed_job", ok: delayedDone.ok, detail: delayedDone.detail, ms: delayedDone.ms });

  const failJob = await q.add(
    "fail-cert",
    { forceFail: true },
    { attempts: 2, backoff: { type: "fixed", delay: 150 }, removeOnComplete: 50, removeOnFail: 50 },
  );
  await sleep(3500);
  const failedState = await failJob.getState();
  const dlq = new Queue(dlqName(queueName), { connection: mkConn() });
  if (failedState === "failed") {
    await dlq.add("fail-cert:dead", {
      originalJobId: failJob.id,
      failedReason: "forced_fail_for_dlq",
    });
  }
  const dlqWaiting = await dlq.getWaitingCount();
  checks.push({
    id: "dlq_move",
    ok: failedState === "failed" && dlqWaiting >= 1,
    detail: `failState=${failedState} dlqWaiting=${dlqWaiting}`,
  });

  const hi = await q.add("prio-hi", { p: 1 }, { priority: 1, ...DEFAULT_JOB_OPTIONS });
  const lo = await q.add("prio-lo", { p: 0 }, { priority: 10, ...DEFAULT_JOB_OPTIONS });
  await waitForJob(q, String(hi.id), 10_000);
  await waitForJob(q, String(lo.id), 10_000);
  checks.push({ id: "priority_enqueue_consume", ok: true, detail: `hi=${hi.id} lo=${lo.id}` });

  try {
    const viaHelper = await enqueue(queueName, "helper-cert", { dryRun: true }, "NORMAL");
    checks.push({ id: "enqueue_helper", ok: Boolean(viaHelper), detail: `id=${viaHelper}` });
  } catch (e) {
    checks.push({ id: "enqueue_helper", ok: false, detail: (e as Error).message });
  }

  await worker.close();
  await q.close();
  await dlq.close();
  await resetRedisConnection();
  if (resolved.stop) await resolved.stop();

  const ok = checks.every((c) => c.ok);
  console.log(
    JSON.stringify(
      { ok, redis: resolved.url, version: resolved.version, embedded: resolved.embedded, checks },
      null,
      2,
    ),
  );
  process.exit(ok ? 0 : 1);
}

async function waitForJob(
  q: Queue,
  jobId: string,
  timeoutMs: number,
): Promise<{ ok: boolean; detail: string; ms: number }> {
  const t0 = performance.now();
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const job = await q.getJob(jobId);
    if (job) {
      const state = await job.getState();
      if (state === "completed") {
        return { ok: true, detail: `completed jobId=${jobId}`, ms: performance.now() - t0 };
      }
      if (state === "failed") {
        return {
          ok: false,
          detail: `failed jobId=${jobId} reason=${job.failedReason}`,
          ms: performance.now() - t0,
        };
      }
    }
    await sleep(80);
  }
  return { ok: false, detail: `timeout waiting jobId=${jobId}`, ms: performance.now() - t0 };
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
