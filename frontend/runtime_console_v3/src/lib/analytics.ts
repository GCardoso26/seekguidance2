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

export type AnalyticsEventName = MonetizationEvent | EngagementEvent | JudgeAssistantEvent | MarketplaceEvent;

export type UserTier = "free" | "pro" | "team";

export type PricingCtaLocation = "header" | "hero_secondary" | "mid_page" | "final_cta" | "footer";

export type EventPayload = {
  event: AnalyticsEventName;
  timestamp: string;
  user_id?: string;
  anonymous_id?: string;
  properties?: Record<string, unknown>;
  tier?: UserTier;
  game_slug?: string;
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
    if (res.ok) {
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
  },
): Promise<void> {
  if (typeof window === "undefined") return;

  const { user_id, tier, game_slug, ...rest } = properties ?? {};
  const payload: EventPayload = {
    event,
    timestamp: new Date().toISOString(),
    anonymous_id: getAnonymousId(),
    user_id,
    tier: tier ?? "free",
    game_slug,
    properties: {
      ...rest,
      session_id: getSessionId(),
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
