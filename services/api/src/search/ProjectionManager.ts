import { createLogger } from "../platform/logging/logger.js";
import { metrics } from "../platform/metrics/registry.js";
import { getClock } from "../shared/time/Clock.js";
import type { SearchProjectionRepository } from "./domain/SearchProjectionRepository.js";
import type { SearchProjectionVersion } from "./domain/SearchProjectionVersion.js";
import {
  computeProjectionCoverage,
  computeProjectionDrift,
  type ProjectionCoverage,
  type ProjectionDrift,
} from "./domain/ProjectionCoverage.js";
import {
  SyncLeadTimeTracker,
  type SyncLeadTimeSample,
  type SyncLeadTimeStats,
} from "./domain/SyncLeadTime.js";

const log = createLogger("projection-manager");

export interface RebuildResult {
  previous: SearchProjectionVersion;
  building: SearchProjectionVersion;
  liveAlias: string;
}

/**
 * ProjectionManager — index lifecycle for Search.
 * Consumer stays thin: only apply events. Manager owns:
 * create index · rebuild · alias swap · retire · version check · coverage/drift · lead time.
 */
export class ProjectionManager {
  private liveAlias: string;
  private previousLiveName: string | null = null;
  private readonly leadTime = new SyncLeadTimeTracker();

  constructor(private readonly projection: SearchProjectionRepository) {
    this.liveAlias = projection.getVersion().name;
  }

  getLiveAlias(): string {
    return this.liveAlias;
  }

  getLiveVersion(): SearchProjectionVersion {
    return this.projection.getVersion();
  }

  getRepository(): SearchProjectionRepository {
    return this.projection;
  }

  /** Ensure live index exists and settings applied. */
  async ensureIndexes(): Promise<SearchProjectionVersion> {
    await this.projection.ensureIndex();
    const v = this.projection.getVersion();
    this.liveAlias = v.name;
    metrics.setGauge("search_projection_version", v.version, { alias: this.liveAlias });
    log.info({ projection: v.name, alias: this.liveAlias }, "projection_ensure_ok");
    return v;
  }

  /**
   * Blue/green rebuild: start cards_v{N+1} (building).
   * Caller rehydrates docs (replay), then calls swapAlias().
   */
  async beginRebuild(nextVersion?: number): Promise<RebuildResult> {
    const previous = this.projection.getVersion();
    const target = nextVersion ?? previous.version + 1;
    this.previousLiveName = previous.name;
    const building = await this.projection.beginRebuild(target);
    metrics.inc("search_projection_rebuild_total", { to: building.name });
    log.info(
      { from: previous.name, to: building.name, alias: this.liveAlias },
      "projection_rebuild_started",
    );
    return { previous, building, liveAlias: this.liveAlias };
  }

  /**
   * Flip live alias to the building index and activate it.
   * Does not delete the previous index — call retirePrevious() after soak.
   */
  async swapAlias(): Promise<{ alias: string; live: SearchProjectionVersion }> {
    const live = await this.projection.activateProjection();
    const oldAlias = this.liveAlias;
    this.liveAlias = live.name;
    metrics.setGauge("search_projection_version", live.version, { alias: this.liveAlias });
    metrics.inc("search_projection_alias_swap_total", {
      from: oldAlias,
      to: this.liveAlias,
    });
    log.info({ from: oldAlias, to: this.liveAlias }, "projection_alias_swapped");
    return { alias: this.liveAlias, live };
  }

  async retirePrevious(): Promise<void> {
    if (!this.previousLiveName || this.previousLiveName === this.liveAlias) return;
    const name = this.previousLiveName;
    await this.projection.retireProjection(name);
    metrics.inc("search_projection_retire_total", { name });
    log.info({ name }, "projection_retired");
    this.previousLiveName = null;
  }

  async retire(name: string): Promise<void> {
    if (name === this.liveAlias) {
      throw new Error(`cannot_retire_live_alias:${name}`);
    }
    await this.projection.retireProjection(name);
    metrics.inc("search_projection_retire_total", { name });
  }

  verifyVersion(expected?: string): { ok: boolean; live: string; expected: string | null } {
    const live = this.projection.getVersion().name;
    const exp = expected ?? this.liveAlias;
    const ok = live === exp && this.projection.getVersion().status === "live";
    return { ok, live, expected: exp };
  }

  async coverage(catalogCards: number): Promise<ProjectionCoverage> {
    const projectionCards = await this.projection.documentCount();
    const cov = computeProjectionCoverage({
      catalogCards,
      projectionCards,
      projection: this.liveAlias,
    });
    metrics.setGauge("search_projection_coverage_pct", cov.coveragePct, {
      projection: this.liveAlias,
    });
    return cov;
  }

  async drift(input?: {
    lastCatalogUpdateAt?: string | null;
    changedSinceProjection?: number;
  }): Promise<ProjectionDrift> {
    const lag = this.projection.getLag();
    const d = computeProjectionDrift({
      changedSinceProjection: input?.changedSinceProjection ?? lag.pendingApprox,
      lastProjectionAt: lag.lastEventAt,
      lastCatalogUpdateAt: input?.lastCatalogUpdateAt ?? null,
      lagMs: lag.lagMs,
      projection: this.liveAlias,
    });
    if (d.lagMs != null) {
      metrics.setGauge("search_projection_drift_lag_ms", d.lagMs, {
        projection: this.liveAlias,
      });
    }
    return d;
  }

  recordLeadTime(sample: Omit<SyncLeadTimeSample, "recordedAt"> & { recordedAt?: string }): void {
    const full: SyncLeadTimeSample = {
      ...sample,
      recordedAt: sample.recordedAt ?? getClock().nowIso(),
    };
    this.leadTime.record(full);
    metrics.observe("search_sync_lead_time_ms", full.providerToSearchableMs, {
      eventType: full.eventType,
    });
  }

  leadTimeStats(): SyncLeadTimeStats {
    return this.leadTime.stats();
  }
}
