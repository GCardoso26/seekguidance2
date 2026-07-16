import { getClock } from "../../shared/time/Clock.js";
import type { SearchCardDocument, SearchFilters, SearchResult } from "../domain/SearchDocument.js";
import {
  evaluateProjectionHealth,
  type ProjectionHealth,
  type ProjectionLag,
} from "../domain/ProjectionHealth.js";
import type { SearchProjectionRepository } from "../domain/SearchProjectionRepository.js";
import {
  createProjectionVersion,
  type SearchProjectionVersion,
} from "../domain/SearchProjectionVersion.js";
import { matchesFilters } from "../filters/SearchFilters.js";

/**
 * In-memory Search projection — tests + local without Meilisearch.
 * Sole writer path for documents when wired through SearchEventConsumer.
 */
export class InMemorySearchProjectionRepository implements SearchProjectionRepository {
  private version: SearchProjectionVersion = createProjectionVersion(1, "live");
  private docs = new Map<string, SearchCardDocument>();
  private retired = new Set<string>();
  private lastEventAt: string | null = null;
  private lastEventId: string | null = null;
  private pendingApprox = 0;

  getVersion(): SearchProjectionVersion {
    return { ...this.version };
  }

  async beginRebuild(nextVersion: number): Promise<SearchProjectionVersion> {
    if (this.version.status === "live") {
      this.version = { ...this.version, status: "draining" };
    }
    this.version = createProjectionVersion(nextVersion, "building");
    this.docs = new Map();
    return this.getVersion();
  }

  async activateProjection(): Promise<SearchProjectionVersion> {
    this.version = { ...this.version, status: "live" };
    return this.getVersion();
  }

  async retireProjection(name: string): Promise<void> {
    this.retired.add(name);
  }

  async upsert(doc: SearchCardDocument): Promise<void> {
    this.docs.set(doc.id, {
      ...doc,
      projection: this.version.name,
    });
  }

  async upsertMany(docs: SearchCardDocument[]): Promise<void> {
    for (const d of docs) await this.upsert(d);
  }

  async delete(id: string): Promise<void> {
    this.docs.delete(id);
  }

  async get(id: string): Promise<SearchCardDocument | null> {
    const d = this.docs.get(id);
    return d ? structuredClone(d) : null;
  }

  async search(filters: SearchFilters): Promise<SearchResult> {
    const t0 = getClock().nowMs();
    const all = [...this.docs.values()].filter((d) => matchesFilters(d, filters));
    const offset = filters.offset ?? 0;
    const limit = filters.limit ?? 20;
    const slice = all.slice(offset, offset + limit);
    return {
      hits: slice.map((document) => ({ document: structuredClone(document) })),
      estimatedTotal: all.length,
      tookMs: getClock().nowMs() - t0,
      projection: this.version.name,
    };
  }

  async documentCount(): Promise<number> {
    return this.docs.size;
  }

  async ensureIndex(): Promise<void> {
    /* no-op */
  }

  async isReachable(): Promise<boolean> {
    return true;
  }

  getLag(): ProjectionLag {
    const lagMs =
      this.lastEventAt == null
        ? null
        : Math.max(0, getClock().nowMs() - Date.parse(this.lastEventAt));
    return {
      lagMs: Number.isFinite(lagMs as number) ? lagMs : null,
      lastEventAt: this.lastEventAt,
      lastEventId: this.lastEventId,
      pendingApprox: this.pendingApprox,
    };
  }

  recordAppliedEvent(eventId: string, occurredAt: string): void {
    this.lastEventId = eventId;
    this.lastEventAt = occurredAt;
    this.pendingApprox = Math.max(0, this.pendingApprox - 1);
  }

  /** Test helper — simulate backlog. */
  setPendingApprox(n: number): void {
    this.pendingApprox = n;
  }

  async getHealth(): Promise<ProjectionHealth> {
    return evaluateProjectionHealth({
      projection: this.version.name,
      lag: this.getLag(),
      indexReachable: await this.isReachable(),
    });
  }
}
