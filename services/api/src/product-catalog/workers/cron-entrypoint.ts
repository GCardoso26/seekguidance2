/**
 * Cron entrypoints for product-catalog (Render cron / one-shot containers).
 * Usage:
 *   node dist/product-catalog/workers/cron-entrypoint.js sealed [--full]
 *   node dist/product-catalog/workers/cron-entrypoint.js accessories [--full]
 *   node dist/product-catalog/workers/cron-entrypoint.js tick [--bootstrap]
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { runProductCatalogSyncJob } from "../cli/runProductCatalogSync.js";
import type { ProductCatalogJobKey } from "../providers/ProductCatalogProvider.js";
import { createCatalogPgPool } from "../persistence/createCatalogPgPool.js";
import { createProviderScheduler } from "../scheduler/ProviderScheduler.js";
import { closeBullmqClient } from "../../platform/bullmq/client.js";

function loadEnvFile() {
  const p = resolve(process.cwd(), ".env");
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!m) continue;
    if (process.env[m[1]]) continue;
    let v = m[2].trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    process.env[m[1]] = v;
  }
}

const ACCESSORY_JOBS: ProductCatalogJobKey[] = [
  "catalog.sync.sleeves",
  "catalog.sync.deckboxes",
  "catalog.sync.binders",
  "catalog.sync.pages",
  "catalog.sync.dice",
  "catalog.sync.counters",
  "catalog.sync.playmats",
];

async function runTick(): Promise<void> {
  // Session pooler ~15 clients total — tick only needs one connection.
  const pool = createCatalogPgPool({ max: 1 });
  try {
    const scheduler = createProviderScheduler(pool);
    if (process.argv.includes("--bootstrap")) {
      await scheduler.syncFromMemoryRegistry();
      console.log("schedules bootstrapped: sealed hourly; accessories daily");
    }
    const result = await scheduler.tick();
    console.log(JSON.stringify(result));
  } finally {
    await pool.end();
    // BullMQ/ioredis keep the event loop alive — without this, Render cron → Timed out.
    await closeBullmqClient();
  }
}

async function main(): Promise<void> {
  loadEnvFile();
  const cmd = process.argv[2] ?? "sealed";
  const mode = process.argv.includes("--full") ? "full" : "incremental";

  try {
    if (cmd === "tick") {
      await runTick();
      return;
    }

    if (cmd === "sealed") {
      await runProductCatalogSyncJob("catalog.sync.sealed", { mode });
      return;
    }

    if (cmd === "accessories") {
      for (const jobKey of ACCESSORY_JOBS) {
        await runProductCatalogSyncJob(jobKey, { mode });
      }
      return;
    }

    console.error(`Usage: cron-entrypoint.js <sealed|accessories|tick> [--full] [--bootstrap]`);
    process.exitCode = 1;
  } finally {
    // One-shot crons: always release Redis so Node can exit (sealed/accessories may touch assets only).
    await closeBullmqClient().catch(() => undefined);
  }
}

main()
  .then(() => {
    // Explicit exit after tick/success — defensive against stray handles.
    if (process.exitCode && process.exitCode !== 0) process.exit(process.exitCode);
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
