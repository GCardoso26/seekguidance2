import { getClock } from "../../shared/time/Clock.js";
import { createLogger } from "../../platform/logging/logger.js";
import { metrics } from "../../platform/metrics/registry.js";
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
import { toMeiliFilter } from "../filters/SearchFilters.js";

const log = createLogger("meilisearch-projection");

export interface MeilisearchProjectionOpts {
  host: string;
  apiKey?: string;
  /** Starting version (default 1 → cards_v1). */
  version?: number;
}

/**
 * Meilisearch adapter for SearchProjectionRepository.
 * Index uid = projection name (cards_v1, cards_v2, …).
 */
export class MeilisearchSearchProjectionRepository implements SearchProjectionRepository {
  private version: SearchProjectionVersion;
  private lastEventAt: string | null = null;
  private lastEventId: string | null = null;
  private pendingApprox = 0;
  private readonly host: string;
  private readonly apiKey?: string;

  constructor(opts: MeilisearchProjectionOpts) {
    this.host = opts.host.replace(/\/$/, "");
    this.apiKey = opts.apiKey;
    this.version = createProjectionVersion(opts.version ?? 1, "live");
  }

  getVersion(): SearchProjectionVersion {
    return { ...this.version };
  }

  async beginRebuild(nextVersion: number): Promise<SearchProjectionVersion> {
    this.version = createProjectionVersion(nextVersion, "building");
    await this.ensureIndex();
    return this.getVersion();
  }

  async activateProjection(): Promise<SearchProjectionVersion> {
    this.version = { ...this.version, status: "live" };
    return this.getVersion();
  }

  async retireProjection(name: string): Promise<void> {
    await this.request("DELETE", `/indexes/${encodeURIComponent(name)}`);
  }

  async upsert(doc: SearchCardDocument): Promise<void> {
    await this.upsertMany([{ ...doc, projection: this.version.name }]);
  }

  async upsertMany(docs: SearchCardDocument[]): Promise<void> {
    if (!docs.length) return;
    const t0 = getClock().nowMs();
    const body = docs.map((d) => ({ ...d, projection: this.version.name }));
    await this.request("POST", `/indexes/${this.version.name}/documents`, body);
    metrics.observe("search_index_ms", getClock().nowMs() - t0, {
      projection: this.version.name,
    });
  }

  async delete(id: string): Promise<void> {
    await this.request("DELETE", `/indexes/${this.version.name}/documents/${encodeURIComponent(id)}`);
  }

  async get(id: string): Promise<SearchCardDocument | null> {
    try {
      const doc = await this.request<SearchCardDocument>(
        "GET",
        `/indexes/${this.version.name}/documents/${encodeURIComponent(id)}`,
      );
      return doc;
    } catch {
      return null;
    }
  }

  async search(filters: SearchFilters): Promise<SearchResult> {
    const t0 = getClock().nowMs();
    const q = filters.q ?? filters.name ?? filters.oracle ?? "";
    const filter = toMeiliFilter({
      ...filters,
      // name/oracle handled via q + attributes when possible
      name: undefined,
      oracle: undefined,
      q: undefined,
    });
    const payload: Record<string, unknown> = {
      q,
      limit: filters.limit ?? 20,
      offset: filters.offset ?? 0,
      filter,
      attributesToSearchOn: filters.oracle
        ? ["oracleText", "name", "nameNormalized"]
        : ["name", "nameNormalized", "oracleText", "setCode", "setName"],
    };
    const data = await this.request<{
      hits: SearchCardDocument[];
      estimatedTotalHits?: number;
      processingTimeMs?: number;
    }>("POST", `/indexes/${this.version.name}/search`, payload);

    let hits = (data.hits ?? []).map((document) => ({ document }));
    if (filters.oracle) {
      const o = filters.oracle.toLowerCase();
      hits = hits.filter((h) => (h.document.oracleText ?? "").toLowerCase().includes(o));
    }
    if (filters.name && !filters.q) {
      const n = filters.name.toLowerCase();
      hits = hits.filter((h) =>
        `${h.document.name} ${h.document.nameNormalized}`.toLowerCase().includes(n),
      );
    }

    return {
      hits,
      estimatedTotal: data.estimatedTotalHits ?? hits.length,
      tookMs: data.processingTimeMs ?? getClock().nowMs() - t0,
      projection: this.version.name,
    };
  }

  async documentCount(): Promise<number> {
    try {
      const stats = await this.request<{ numberOfDocuments?: number }>(
        "GET",
        `/indexes/${this.version.name}/stats`,
      );
      return stats.numberOfDocuments ?? 0;
    } catch {
      return 0;
    }
  }

  async ensureIndex(): Promise<void> {
    await this.request("POST", "/indexes", {
      uid: this.version.name,
      primaryKey: "id",
    }).catch(() => undefined);

    await this.request("PATCH", `/indexes/${this.version.name}/settings`, {
      searchableAttributes: [
        "name",
        "nameNormalized",
        "oracleText",
        "setCode",
        "setName",
      ],
      filterableAttributes: [
        "setCode",
        "language",
        "rarity",
        "finishes",
        "storeIds",
        "hasStock",
        "priceMin",
        "priceMax",
        "projection",
      ],
      sortableAttributes: ["name", "priceMin", "stockTotal"],
    });
  }

  async isReachable(): Promise<boolean> {
    try {
      const h = await this.request<{ status?: string }>("GET", "/health");
      return h.status === "available";
    } catch {
      return false;
    }
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

  async getHealth(): Promise<ProjectionHealth> {
    return evaluateProjectionHealth({
      projection: this.version.name,
      lag: this.getLag(),
      indexReachable: await this.isReachable(),
    });
  }

  private async request<T = unknown>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (this.apiKey) headers.Authorization = `Bearer ${this.apiKey}`;
    const res = await fetch(`${this.host}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      log.warn({ method, path, status: res.status, body: text.slice(0, 200) }, "meili_http_error");
      throw new Error(`meili_http_${res.status}`);
    }
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }
}

export function createSearchProjectionFromEnv(): SearchProjectionRepository | null {
  const host = process.env.MEILI_HOST?.trim();
  if (!host) return null;
  return new MeilisearchSearchProjectionRepository({
    host,
    apiKey: process.env.MEILI_MASTER_KEY || process.env.MEILI_API_KEY,
    version: Number(process.env.SEARCH_PROJECTION_VERSION ?? "1") || 1,
  });
}
