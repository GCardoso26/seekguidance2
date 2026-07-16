/**
 * Product funnel events — adapter-agnostic.
 * Sprint 7.1: console structured sink. Swap later without coupling pages.
 */

export type AnalyticsEventName =
  | "seller_portal_visit"
  | "seller_signup_started"
  | "seller_signup_completed"
  | "seller_shop_created"
  | "seller_first_search"
  | "seller_card_selected"
  | "seller_listing_publish_started"
  | "seller_listing_published"
  | "seller_time_to_first_listing_ms"
  | "seller_intent_after_first_listing"
  | "buyer_search"
  | "buyer_card_open"
  | "buyer_offers_viewed"
  | "buyer_add_to_cart"
  | "buyer_checkout_started";

export interface AnalyticsEvent {
  name: AnalyticsEventName;
  props?: Record<string, unknown>;
  at: string;
}

type Sink = (event: AnalyticsEvent) => void;

let sink: Sink = (event) => {
  // Structured console — replace with endpoint / vendor later
  console.info(JSON.stringify({ type: "analytics", ...event }));
};

export const Analytics = {
  setSink(next: Sink) {
    sink = next;
  },

  track(name: AnalyticsEventName, props?: Record<string, unknown>) {
    sink({ name, props, at: new Date().toISOString() });
  },
};
