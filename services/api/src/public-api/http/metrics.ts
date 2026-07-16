import { metrics } from "../../platform/metrics/registry.js";

/** In-process public API observability (Sprint 3.5). */
export class PublicApiMetrics {
  private latencies: number[] = [];
  private queries = new Map<string, number>();
  private total = 0;
  private zeroResults = 0;
  private cacheHits = 0;
  private cacheMisses = 0;
  private windowStartedMs = Date.now();

  recordLatency(ms: number): void {
    this.latencies.push(ms);
    if (this.latencies.length > 2_000) this.latencies.shift();
    metrics.observe("public_search_latency_ms", ms);
  }

  recordQuery(q: string, hits: number): void {
    this.total += 1;
    const key = q.trim().toLowerCase() || "(empty)";
    this.queries.set(key, (this.queries.get(key) ?? 0) + 1);
    if (hits === 0) this.zeroResults += 1;
    metrics.inc("public_search_requests_total", { zero: hits === 0 ? "1" : "0" });
  }

  recordCache(hit: boolean): void {
    if (hit) {
      this.cacheHits += 1;
      metrics.inc("public_api_cache_hit_total");
    } else {
      this.cacheMisses += 1;
      metrics.inc("public_api_cache_miss_total");
    }
  }

  snapshot(): {
    qps: number;
    latency: { p50: number | null; p95: number | null; p99: number | null };
    zeroResultsPct: number;
    cacheHitRate: number;
    topQueries: Array<{ q: string; count: number }>;
  } {
    const elapsedSec = Math.max(0.001, (Date.now() - this.windowStartedMs) / 1000);
    const sorted = [...this.latencies].sort((a, b) => a - b);
    const pct = (p: number) =>
      sorted.length === 0
        ? null
        : sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))]!;
    const cacheTotal = this.cacheHits + this.cacheMisses;
    const topQueries = [...this.queries.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([q, count]) => ({ q, count }));

    return {
      qps: this.total / elapsedSec,
      latency: { p50: pct(0.5), p95: pct(0.95), p99: pct(0.99) },
      zeroResultsPct: this.total === 0 ? 0 : (this.zeroResults / this.total) * 100,
      cacheHitRate: cacheTotal === 0 ? 0 : (this.cacheHits / cacheTotal) * 100,
      topQueries,
    };
  }
}

export const publicApiMetrics = new PublicApiMetrics();
