"use client";

export type MonetizationEvent =
  | "pricing_page_view"
  | "pricing_toggle"
  | "pricing_cta_click"
  | "pricing_start_free"
  | "paywall_hit"
  | "upgrade_modal_open"
  | "upgrade_modal_close"
  | "checkout_started"
  | "checkout_completed"
  | "checkout_failed"
  | "subscription_cancelled"
  | "subscription_renewed";

export type EngagementEvent =
  | "question_asked"
  | "verdict_shared"
  | "source_clicked"
  | "feedback_given"
  | "favorite_saved"
  | "game_changed"
  | "search_used"
  | "history_opened"
  | "tournament_create_started"
  | "tournament_created";

export type JudgeAssistantEvent =
  | "report_created"
  | "report_resolved"
  | "ruling_applied"
  | "deck_validated";

export type MarketplaceEvent =
  | "page_view"
  | "card_view"
  | "search"
  | "add_to_cart"
  | "purchase"
  | "listing_create";

export type BuyerExperienceEvent =
  | "wishlist_add"
  | "wishlist_remove"
  | "wishlist_created"
  | "wishlist_shared"
  | "wishlist_converted"
  | "shipping_quote"
  | "freight_selected"
  | "gallery_mode"
  | "image_retry"
  | "image_failure"
  | "checkout_started"
  | "checkout_completed"
  | "buyer_ai_used"
  | "search_converted"
  | "smart_cart_used"
  | "cart_abandon_hint"
  | "recommendation_click"
  | "buyer_insight_click"
  | "smart_cart_goal"
  | "deck_shop_open"
  | "collection_import"
  | "time_to_purchase_ms"
  | "announce_card_click"
  | "card_dwell_ms"
  | "card_buy_click"
  | "card_add_to_cart";

export type AnalyticsEventName =
  | MonetizationEvent
  | EngagementEvent
  | JudgeAssistantEvent
  | MarketplaceEvent
  | BuyerExperienceEvent;

export type UserTier = "free" | "pro" | "team";

export type PricingCtaLocation = "header" | "hero_secondary" | "mid_page" | "final_cta" | "footer";

/** Envelope schema version — keep in sync with EVENT_VERSIONING.md / BE SUPPORTED_SCHEMA_VERSIONS */
export const ANALYTICS_SCHEMA_VERSION = 1 as const;

export type EventPayload = {
  event: AnalyticsEventName;
  timestamp: string;
  event_schema_version: number;
  user_id?: string;
  anonymous_id?: string;
  properties?: Record<string, unknown>;
  tier?: UserTier;
  game_slug?: string;
  idempotency_key?: string;
  source?: string;
};

const QUEUE_KEY = "analytics_queue";
const ANON_KEY = "analytics_anonymous_id";
const SESSION_KEY = "analytics_session_id";

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

const FLUSH_IMMEDIATE = new Set<AnalyticsEventName>([
  "checkout_started",
  "checkout_completed",
  "checkout_failed",
  "paywall_hit",
  "purchase",
  "add_to_cart",
  "listing_create",
  "wishlist_shared",
  "wishlist_converted",
]);

const IDEMPOTENT_EVENTS = new Set<AnalyticsEventName>([
  "purchase",
  "checkout_started",
  "checkout_completed",
  "checkout_failed",
  "listing_create",
  "wishlist_shared",
  "add_to_cart",
  "wishlist_converted",
]);

function getAnonymousId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(ANON_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(ANON_KEY, id);
  }
  return id;
}

function readQueue(): EventPayload[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]") as EventPayload[];
  } catch {
    return [];
  }
}

function writeQueue(queue: EventPayload[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

type TrackResponse = {
  ok?: boolean;
  received?: number;
  persisted?: number;
  dead_lettered?: number;
  duplicates?: number;
  lost?: number;
  ingest_trace_id?: string;
};

function batchAccounted(data: TrackResponse, sent: number): boolean {
  const persisted = data.persisted ?? 0;
  const dead = data.dead_lettered ?? 0;
  const dupes = data.duplicates ?? 0;
  const accounted = persisted + dead + dupes;
  // Prefer explicit ok from Beta 1.5 ingest; fall back to accounting.
  if (typeof data.ok === "boolean") {
    return data.ok && (data.lost ?? 0) === 0;
  }
  // Legacy upstream that only returned { received: inserted }
  return accounted >= sent || (typeof data.received === "number" && data.received >= 0);
}

export async function flushAnalytics(): Promise<void> {
  if (typeof window === "undefined") return;
  const queue = readQueue();
  if (queue.length === 0) return;
  try {
    const res = await fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events: queue }),
      keepalive: true,
    });
    if (!res.ok) return;
    let data: TrackResponse = {};
    try {
      data = (await res.json()) as TrackResponse;
    } catch {
      /* soft-200 empty body — treat as ambiguous; keep queue */
      return;
    }
    // Gateways always HTTP 200; integrity is in body.ok / accounting.
    if (data.ok === false || (typeof data.lost === "number" && data.lost > 0)) {
      return;
    }
    if (batchAccounted(data, queue.length)) {
      localStorage.removeItem(QUEUE_KEY);
    }
  } catch {
    /* falha silenciosa — fila mantida para retry */
  }
}

export async function trackEvent(
  event: AnalyticsEventName,
  properties?: Record<string, unknown> & {
    user_id?: string;
    tier?: UserTier;
    game_slug?: string;
    idempotency_key?: string;
  },
): Promise<void> {
  if (typeof window === "undefined") return;

  const { user_id, tier, game_slug, idempotency_key: idemIn, ...rest } = properties ?? {};
  const sessionId = getSessionId();
  const seed =
    rest.order_id ??
    rest.session_id ??
    rest.list_id ??
    rest.listing_id ??
    rest.product_id ??
    rest.card_id;
  const idempotency_key =
    idemIn ??
    (IDEMPOTENT_EVENTS.has(event)
      ? seed != null
        ? `${event}:${String(seed)}`
        : `${event}:${sessionId}`
      : undefined);

  const payload: EventPayload = {
    event,
    timestamp: new Date().toISOString(),
    event_schema_version: ANALYTICS_SCHEMA_VERSION,
    anonymous_id: getAnonymousId(),
    user_id,
    tier: tier ?? "free",
    game_slug,
    idempotency_key,
    source: "client",
    properties: {
      ...rest,
      session_id: sessionId,
      event_schema_version: ANALYTICS_SCHEMA_VERSION,
      ...(typeof window !== "undefined"
        ? { url: window.location.href, referrer: document.referrer }
        : {}),
    },
  };

  const queue = readQueue();
  queue.push(payload);
  writeQueue(queue);

  if (FLUSH_IMMEDIATE.has(event) || queue.length >= 10) {
    await flushAnalytics();
  }
}

export function __resetAnalyticsForTests() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(QUEUE_KEY);
  localStorage.removeItem(ANON_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}

export function __readAnalyticsQueueForTests(): EventPayload[] {
  return readQueue();
}
