import type { SearchProjectionRepository } from "../domain/SearchProjectionRepository.js";
import type { ProjectionHealth } from "../domain/ProjectionHealth.js";
import type { SearchResult } from "../domain/SearchDocument.js";

export interface SearchPerformanceReport {
  projection: string;
  health: ProjectionHealth;
  lagMs: number | null;
  documentCount: number;
  sampleQueries: Array<{
    label: string;
    tookMs: number;
    hits: number;
    ok: boolean;
  }>;
  p95Ms: number | null;
  notes: string[];
}

/**
 * Smoke performance report — sample card-name queries against live projection.
 */
export async function buildSearchPerformanceReport(
  projection: SearchProjectionRepository,
  queries: Array<{ label: string; q: string }> = [
    { label: "black_lotus", q: "Black Lotus" },
    { label: "lightning_bolt", q: "Lightning Bolt" },
    { label: "counterspell", q: "Counterspell" },
  ],
): Promise<SearchPerformanceReport> {
  const notes: string[] = [];
  const health = await projection.getHealth();
  const lag = projection.getLag();
  const documentCount = await projection.documentCount();

  const sampleQueries: SearchPerformanceReport["sampleQueries"] = [];
  const times: number[] = [];

  for (const q of queries) {
    let result: SearchResult;
    try {
      result = await projection.search({ q: q.q, limit: 10 });
      sampleQueries.push({
        label: q.label,
        tookMs: result.tookMs,
        hits: result.hits.length,
        ok: result.tookMs < 100,
      });
      times.push(result.tookMs);
      if (result.tookMs >= 100) notes.push(`${q.label}_over_100ms`);
    } catch (err) {
      sampleQueries.push({
        label: q.label,
        tookMs: -1,
        hits: 0,
        ok: false,
      });
      notes.push(`${q.label}_error:${err instanceof Error ? err.message : String(err)}`);
    }
  }

  times.sort((a, b) => a - b);
  const p95Ms =
    times.length === 0
      ? null
      : times[Math.min(times.length - 1, Math.floor(times.length * 0.95))]!;

  return {
    projection: projection.getVersion().name,
    health,
    lagMs: lag.lagMs,
    documentCount,
    sampleQueries,
    p95Ms,
    notes,
  };
}
