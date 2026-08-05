import type { Pool } from "pg";
import { enqueueProductCatalogSync } from "../jobs/enqueueProductCatalogSync.js";
import type { ProductCatalogJobKey } from "../providers/ProductCatalogProvider.js";
import { createLogger } from "../../platform/logging/logger.js";
import { productCatalogProviderRegistry } from "../providers/registry.js";

const log = createLogger("provider.scheduler");

export type ScheduleKind = "every" | "hourly" | "daily" | "weekly" | "manual";

/** ADR-016 hard-exit — may still exist as stale rows in provider_registry. */
export const SCHEDULER_DENYLISTED_PROVIDER_IDS = new Set(["star-wars-sealed"]);

function nextRunAt(kind: ScheduleKind, from = new Date()): Date | null {
  const d = new Date(from);
  switch (kind) {
    case "hourly":
      d.setHours(d.getHours() + 1);
      return d;
    case "daily":
      d.setDate(d.getDate() + 1);
      return d;
    case "weekly":
      d.setDate(d.getDate() + 7);
      return d;
    case "every":
      d.setMinutes(d.getMinutes() + 15);
      return d;
    case "manual":
    default:
      return null;
  }
}

export function categoryToJobKey(category: string): ProductCatalogJobKey | null {
  const map: Record<string, ProductCatalogJobKey> = {
    SEALED_PRODUCT: "catalog.sync.sealed",
    SLEEVES: "catalog.sync.sleeves",
    DECK_BOX: "catalog.sync.deckboxes",
    BINDER: "catalog.sync.binders",
    BINDER_PAGE: "catalog.sync.pages",
    DICE: "catalog.sync.dice",
    COUNTERS: "catalog.sync.counters",
    PLAYMAT: "catalog.sync.playmats",
  };
  return map[category] ?? null;
}

type DueRow = {
  provider_id: string;
  category: string;
  schedule_kind: ScheduleKind;
  circuit_open_until: Date | null;
};

/**
 * Group due providers by job key — enqueue catalog.sync.sealed once, not once per sealed provider.
 */
export function groupDueProvidersByJobKey(
  rows: DueRow[],
): {
  byJob: Map<ProductCatalogJobKey, DueRow[]>;
  denylisted: DueRow[];
  unknownCategory: DueRow[];
} {
  const byJob = new Map<ProductCatalogJobKey, DueRow[]>();
  const denylisted: DueRow[] = [];
  const unknownCategory: DueRow[] = [];
  for (const row of rows) {
    if (SCHEDULER_DENYLISTED_PROVIDER_IDS.has(row.provider_id)) {
      denylisted.push(row);
      continue;
    }
    const jobKey = categoryToJobKey(row.category);
    if (!jobKey) {
      unknownCategory.push(row);
      continue;
    }
    const list = byJob.get(jobKey) ?? [];
    list.push(row);
    byJob.set(jobKey, list);
  }
  return { byJob, denylisted, unknownCategory };
}

/**
 * ProviderRegistry → Scheduler → BullMQ.
 * Lê product_catalog.provider_registry e enfileira jobs vencidos.
 */
export class ProviderScheduler {
  constructor(private readonly pool: Pool) {}

  async registerSchedule(
    providerId: string,
    category: string,
    kind: ScheduleKind,
    opts?: { cronExpr?: string; rateLimitRpm?: number },
  ): Promise<void> {
    const next = nextRunAt(kind);
    await this.pool.query(
      `
      INSERT INTO product_catalog.provider_registry (
        provider_id, category, schedule_kind, schedule_expr, next_run_at, rate_limit_rpm, enabled
      ) VALUES ($1,$2,$3,$4,$5,$6,true)
      ON CONFLICT (provider_id) DO UPDATE SET
        schedule_kind = EXCLUDED.schedule_kind,
        schedule_expr = EXCLUDED.schedule_expr,
        next_run_at = EXCLUDED.next_run_at,
        rate_limit_rpm = EXCLUDED.rate_limit_rpm,
        updated_at = now()
      `,
      [providerId, category, kind, opts?.cronExpr ?? null, next?.toISOString() ?? null, opts?.rateLimitRpm ?? null],
    );
  }

  async tick(): Promise<{
    enqueued: string[];
    jobs: string[];
    disabled: string[];
    skipped: string[];
  }> {
    const due = await this.pool.query<DueRow>(
      `
      SELECT provider_id, category, schedule_kind, circuit_open_until
      FROM product_catalog.provider_registry
      WHERE enabled = true
        AND schedule_kind <> 'manual'
        AND next_run_at IS NOT NULL
        AND next_run_at <= now()
        AND (circuit_open_until IS NULL OR circuit_open_until < now())
      ORDER BY next_run_at ASC
      `,
    );

    const { byJob, denylisted, unknownCategory } = groupDueProvidersByJobKey(due.rows);
    const disabled: string[] = [];
    const skipped: string[] = unknownCategory.map((r) => r.provider_id);

    for (const row of denylisted) {
      await this.pool.query(
        `UPDATE product_catalog.provider_registry
         SET enabled = false, last_status = 'denylisted', updated_at = now()
         WHERE provider_id = $1`,
        [row.provider_id],
      );
      disabled.push(row.provider_id);
      log.warn({ providerId: row.provider_id }, "scheduler_disabled_denylisted_provider");
    }

    const enqueued: string[] = [];
    const jobs: string[] = [];

    for (const [jobKey, rows] of byJob) {
      try {
        const jobId = await enqueueProductCatalogSync(jobKey, { mode: "incremental" });
        jobs.push(`${jobKey}:${jobId}`);
        for (const row of rows) {
          enqueued.push(`${row.provider_id}:${jobId}`);
          const next = nextRunAt(row.schedule_kind);
          await this.pool.query(
            `UPDATE product_catalog.provider_registry SET next_run_at = $2, last_status = 'queued', updated_at = now()
             WHERE provider_id = $1`,
            [row.provider_id, next?.toISOString() ?? null],
          );
        }
      } catch (e) {
        log.error({ jobKey, err: String(e) }, "scheduler_enqueue_failed");
      }
    }

    log.info(
      {
        dueProviders: due.rows.length,
        uniqueJobs: jobs.length,
        enqueuedProviders: enqueued.length,
        disabled: disabled.length,
      },
      "scheduler_tick_done",
    );
    return { enqueued, jobs, disabled, skipped };
  }

  /** Bootstrap schedules from in-memory registry — manufacturers daily (24h), sealed hourly detection. */
  async syncFromMemoryRegistry(defaults: Partial<Record<string, ScheduleKind>> = {}): Promise<void> {
    for (const job of productCatalogProviderRegistry.listJobs()) {
      for (const p of productCatalogProviderRegistry.getProvidersForJob(job)) {
        if (SCHEDULER_DENYLISTED_PROVIDER_IDS.has(p.providerId)) continue;
        const kind =
          defaults[p.providerId] ??
          (p.category === "SEALED_PRODUCT" ? "hourly" : "daily");
        await this.registerSchedule(p.providerId, p.category, kind);
      }
    }
    // Disable stale denylisted rows left from older bootstraps.
    for (const providerId of SCHEDULER_DENYLISTED_PROVIDER_IDS) {
      await this.pool.query(
        `UPDATE product_catalog.provider_registry
         SET enabled = false, last_status = 'denylisted', updated_at = now()
         WHERE provider_id = $1 AND enabled = true`,
        [providerId],
      );
    }
  }
}

export function createProviderScheduler(pool: Pool): ProviderScheduler {
  return new ProviderScheduler(pool);
}
