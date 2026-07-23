import type { Pool } from "pg";
import { enqueueProductCatalogSync } from "../jobs/enqueueProductCatalogSync.js";
import type { ProductCatalogJobKey } from "../providers/ProductCatalogProvider.js";
import { createLogger } from "../../platform/logging/logger.js";
import { productCatalogProviderRegistry } from "../providers/registry.js";

const log = createLogger("provider.scheduler");

export type ScheduleKind = "every" | "hourly" | "daily" | "weekly" | "manual";

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

  async tick(): Promise<{ enqueued: string[] }> {
    const due = await this.pool.query<{
      provider_id: string;
      category: string;
      schedule_kind: ScheduleKind;
      circuit_open_until: Date | null;
    }>(
      `
      SELECT provider_id, category, schedule_kind, circuit_open_until
      FROM product_catalog.provider_registry
      WHERE enabled = true
        AND schedule_kind <> 'manual'
        AND next_run_at IS NOT NULL
        AND next_run_at <= now()
        AND (circuit_open_until IS NULL OR circuit_open_until < now())
      `,
    );

    const enqueued: string[] = [];
    for (const row of due.rows) {
      const jobKey = categoryToJobKey(row.category);
      if (!jobKey) continue;
      try {
        const jobId = await enqueueProductCatalogSync(jobKey, { mode: "incremental" });
        enqueued.push(`${row.provider_id}:${jobId}`);
        const next = nextRunAt(row.schedule_kind);
        await this.pool.query(
          `UPDATE product_catalog.provider_registry SET next_run_at = $2, last_status = 'queued', updated_at = now()
           WHERE provider_id = $1`,
          [row.provider_id, next?.toISOString() ?? null],
        );
      } catch (e) {
        log.error({ providerId: row.provider_id, err: String(e) }, "scheduler_enqueue_failed");
      }
    }
    return { enqueued };
  }

  /** Bootstrap schedules from in-memory registry — manufacturers daily (24h), sealed hourly detection. */
  async syncFromMemoryRegistry(defaults: Partial<Record<string, ScheduleKind>> = {}): Promise<void> {
    for (const job of productCatalogProviderRegistry.listJobs()) {
      for (const p of productCatalogProviderRegistry.getProvidersForJob(job)) {
        const kind =
          defaults[p.providerId] ??
          (p.category === "SEALED_PRODUCT" ? "hourly" : "daily");
        await this.registerSchedule(p.providerId, p.category, kind);
      }
    }
  }
}

function categoryToJobKey(category: string): ProductCatalogJobKey | null {
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

export function createProviderScheduler(pool: Pool): ProviderScheduler {
  return new ProviderScheduler(pool);
}
