/** Prometheus-style metric names (Sprint 6 expands domain coverage). */
export type MetricName =
  | "sync_duration_seconds"
  | "sync_cards_total"
  | "sync_errors_total"
  | "queue_depth"
  | "outbox_backlog"
  | "outbox_published_total"
  | "outbox_dead_total"
  | "outbox_publish_duration_seconds"
  | "outbox_oldest_pending_age_seconds"
  | "provider_latency_ms"
  | "provider_http_errors"
  | "provider_rate_limit_hits"
  | "cards_per_second"
  | "repository_upsert_total"
  | "events_per_card"
  | "outbox_events_per_sync"
  | "search_consume_ms"
  | "search_index_ms"
  | "search_events_applied_total"
  | "search_projection_version"
  | "search_projection_rebuild_total"
  | "search_projection_alias_swap_total"
  | "search_projection_retire_total"
  | "search_projection_coverage_pct"
  | "search_projection_drift_lag_ms"
  | "search_sync_lead_time_ms"
  | "public_search_latency_ms"
  | "public_search_requests_total"
  | "public_api_cache_hit_total"
  | "public_api_cache_miss_total"
  | "marketplace_first_listing_ms"
  | "marketplace_listing_to_searchable_ms"
  | "marketplace_listings_active"
  | "marketplace_listings_published_total"
  | "search_provider_to_search_ms"
  | "search_listing_to_search_ms"
  | "search_get_latency_ms"
  | "offers_get_latency_ms"
  | "identity_register_total"
  | "identity_login_total"
  | "identity_refresh_total"
  | "identity_logout_total"
  | "identity_auth_401_total"
  | "identity_auth_403_total"
  // Sprint 6 — Catalog
  | "catalog_sync_total"
  | "catalog_sync_duration_seconds"
  | "catalog_sync_failures_total"
  | "catalog_cards_processed_total"
  // Sprint 6 — Outbox (critical)
  | "outbox_pending_events"
  | "outbox_oldest_event_age_seconds"
  | "outbox_publish_failures_total"
  | "outbox_retry_total"
  | "outbox_dead_events_total"
  // Sprint 6 — Search
  | "search_projection_lag_seconds"
  | "search_consumer_errors_total"
  | "search_index_operations_total"
  | "search_zero_results_total"
  // Sprint 6 — Marketplace
  | "marketplace_active_listings"
  | "listing_publish_duration_seconds"
  | "listing_to_search_latency_seconds"
  // Sprint 6 — Checkout
  | "checkout_started_total"
  | "checkout_completed_total"
  | "checkout_failed_total"
  | "checkout_duration_seconds"
  // Sprint 6 — Reservation
  | "reservation_hold_total"
  | "reservation_conflict_total"
  | "reservation_expired_total"
  | "reservation_release_total"
  // Sprint 6 — Payment
  | "payment_requested_total"
  | "payment_authorized_total"
  | "payment_failed_total"
  | "payment_pending_total"
  | "payment_webhook_duplicate_total"
  // Platform
  | "http_requests_total"
  | "http_request_duration_seconds"
  | "http_errors_total";

type Labels = Record<string, string>;

export class MetricsRegistry {
  private counters = new Map<string, number>();
  private gauges = new Map<string, number>();
  private histograms = new Map<string, number[]>();

  private key(name: string, labels?: Labels): string {
    if (!labels) return name;
    const parts = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(",");
    return `${name}{${parts}}`;
  }

  inc(name: MetricName, labels?: Labels, by = 1): void {
    const k = this.key(name, labels);
    this.counters.set(k, (this.counters.get(k) ?? 0) + by);
  }

  setGauge(name: MetricName, value: number, labels?: Labels): void {
    this.gauges.set(this.key(name, labels), value);
  }

  observe(name: MetricName, value: number, labels?: Labels): void {
    const k = this.key(name, labels);
    const arr = this.histograms.get(k) ?? [];
    arr.push(value);
    this.histograms.set(k, arr);
  }

  getCounter(name: MetricName, labels?: Labels): number {
    return this.counters.get(this.key(name, labels)) ?? 0;
  }

  getGauge(name: MetricName, labels?: Labels): number {
    return this.gauges.get(this.key(name, labels)) ?? 0;
  }

  snapshot(): Record<string, number | number[]> {
    const out: Record<string, number | number[]> = {};
    for (const [k, v] of this.counters) out[`counter:${k}`] = v;
    for (const [k, v] of this.gauges) out[`gauge:${k}`] = v;
    for (const [k, v] of this.histograms) out[`histogram:${k}`] = v;
    return out;
  }

  /** Prometheus text exposition (OpenMetrics-compatible subset). */
  toPrometheusText(): string {
    const lines: string[] = [];
    const emittedHelp = new Set<string>();

    const baseName = (key: string): string => key.replace(/\{.*\}$/, "");

    for (const [key, value] of this.counters) {
      const name = baseName(key);
      if (!emittedHelp.has(`c:${name}`)) {
        lines.push(`# HELP ${name} counter`);
        lines.push(`# TYPE ${name} counter`);
        emittedHelp.add(`c:${name}`);
      }
      lines.push(`${key} ${value}`);
    }
    for (const [key, value] of this.gauges) {
      const name = baseName(key);
      if (!emittedHelp.has(`g:${name}`)) {
        lines.push(`# HELP ${name} gauge`);
        lines.push(`# TYPE ${name} gauge`);
        emittedHelp.add(`g:${name}`);
      }
      lines.push(`${key} ${value}`);
    }
    for (const [key, values] of this.histograms) {
      const name = baseName(key);
      if (!emittedHelp.has(`h:${name}`)) {
        lines.push(`# HELP ${name} histogram observations (sum/count)`);
        lines.push(`# TYPE ${name} summary`);
        emittedHelp.add(`h:${name}`);
      }
      const sum = values.reduce((a, b) => a + b, 0);
      const count = values.length;
      const bare = key.includes("{") ? key.replace(/\{/, "_sum{") : `${key}_sum`;
      const bareCount = key.includes("{") ? key.replace(/\{/, "_count{") : `${key}_count`;
      // simpler: emit as name_sum / name_count without label surgery
      lines.push(`${name}_sum ${sum}`);
      lines.push(`${name}_count ${count}`);
      void bare;
      void bareCount;
    }
    lines.push("");
    return lines.join("\n");
  }

  reset(): void {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
  }
}

export const metrics = new MetricsRegistry();
