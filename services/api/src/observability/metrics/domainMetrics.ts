import { metrics } from "../../platform/metrics/registry.js";

/** Domain metric helpers — Sprint 6. Controllers/AS call these; never SQL. */

export const domainMetrics = {
  catalogSync(ok: boolean, durationSec: number, cards: number): void {
    metrics.inc("catalog_sync_total", { outcome: ok ? "ok" : "fail" });
    metrics.observe("catalog_sync_duration_seconds", durationSec);
    if (!ok) metrics.inc("catalog_sync_failures_total");
    if (cards > 0) metrics.inc("catalog_cards_processed_total", undefined, cards);
  },

  outboxPending(n: number): void {
    metrics.setGauge("outbox_pending_events", n);
    metrics.setGauge("outbox_backlog", n);
  },
  outboxOldestAge(seconds: number): void {
    metrics.setGauge("outbox_oldest_event_age_seconds", seconds);
    metrics.setGauge("outbox_oldest_pending_age_seconds", seconds);
  },
  outboxPublishFail(): void {
    metrics.inc("outbox_publish_failures_total");
  },
  outboxRetry(): void {
    metrics.inc("outbox_retry_total");
  },
  outboxDead(n: number): void {
    metrics.setGauge("outbox_dead_events_total", n);
    metrics.setGauge("outbox_dead_total", n);
  },

  searchLag(seconds: number): void {
    metrics.setGauge("search_projection_lag_seconds", seconds);
  },
  searchConsumerError(): void {
    metrics.inc("search_consumer_errors_total");
  },
  searchIndexOp(): void {
    metrics.inc("search_index_operations_total");
  },
  searchZeroResults(): void {
    metrics.inc("search_zero_results_total");
  },

  marketplaceActiveListings(n: number): void {
    metrics.setGauge("marketplace_active_listings", n);
    metrics.setGauge("marketplace_listings_active", n);
  },
  listingPublishDuration(seconds: number): void {
    metrics.observe("listing_publish_duration_seconds", seconds);
  },
  listingToSearchLatency(seconds: number): void {
    metrics.observe("listing_to_search_latency_seconds", seconds);
  },

  checkoutStarted(): void {
    metrics.inc("checkout_started_total");
  },
  checkoutCompleted(durationSec: number): void {
    metrics.inc("checkout_completed_total");
    metrics.observe("checkout_duration_seconds", durationSec);
  },
  checkoutFailed(): void {
    metrics.inc("checkout_failed_total");
  },

  reservationHold(): void {
    metrics.inc("reservation_hold_total");
  },
  reservationConflict(): void {
    metrics.inc("reservation_conflict_total");
  },
  reservationExpired(n = 1): void {
    metrics.inc("reservation_expired_total", undefined, n);
  },
  reservationRelease(): void {
    metrics.inc("reservation_release_total");
  },

  paymentRequested(): void {
    metrics.inc("payment_requested_total");
  },
  paymentAuthorized(): void {
    metrics.inc("payment_authorized_total");
  },
  paymentFailed(): void {
    metrics.inc("payment_failed_total");
  },
  paymentPending(n: number): void {
    metrics.setGauge("payment_pending_total", n);
  },
  paymentWebhookDuplicate(): void {
    metrics.inc("payment_webhook_duplicate_total");
  },

  httpRequest(route: string, status: number, durationSec: number): void {
    metrics.inc("http_requests_total", { route, status: String(status) });
    metrics.observe("http_request_duration_seconds", durationSec, { route });
    if (status >= 500) metrics.inc("http_errors_total", { route });
  },
};
