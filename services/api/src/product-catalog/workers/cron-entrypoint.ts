/**
 * Cron entrypoints for product-catalog (Render cron / one-shot containers).
 * Usage:
 *   node dist/product-catalog/workers/cron-entrypoint.js sealed [--full]
 *   node dist/product-catalog/workers/cron-entrypoint.js accessories [--full]
 *   node dist/product-catalog/workers/cron-entrypoint.js tick [--bootstrap]
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { Pool } from "pg";
import { runProductCatalogSyncJob } from "../cli/runProductCatalogSync.js";
import type { ProductCatalogJobKey } from "../providers/ProductCatalogProvider.js";
import { createProviderScheduler } from "../scheduler/ProviderScheduler.js";

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

function pgUrl(raw: string): string {
  return raw.replace(/^postgresql\+asyncpg:/, "postgresql:");
}

async function runTick(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL required");
  const pool = new Pool({ connectionString: pgUrl(databaseUrl) });
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
  }
}

async function main(): Promise<void> {
  loadEnvFile();
  const cmd = process.argv[2] ?? "sealed";
  const mode = process.argv.includes("--full") ? "full" : "incremental";

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
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
