import { metrics, type MetricName } from "../platform/metrics/registry.js";

/**
 * Business / product metrics (Sprint 4.4).
 * Wired into auth + marketplace write paths; snapshot via metrics.snapshot().
 */

export type BusinessMetric =
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
  | "identity_auth_403_total";

/** Register names into the shared registry type via cast — keep names stable. */
export function bizInc(name: BusinessMetric, labels?: Record<string, string>, by = 1): void {
  metrics.inc(name as MetricName, labels, by);
}

export function bizObserve(name: BusinessMetric, value: number, labels?: Record<string, string>): void {
  metrics.observe(name as MetricName, value, labels);
}

export function bizGauge(name: BusinessMetric, value: number, labels?: Record<string, string>): void {
  metrics.setGauge(name as MetricName, value, labels);
}
