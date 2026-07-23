/**
 * Player journey continuity — intelligent cache invalidation across modules.
 * Frontend composition only. Domain sync remains Outbox → Projection → CQRS.
 */

import type { QueryClient } from "@tanstack/react-query";
import {
  GAMIFICATION_BADGES_KEY,
  GAMIFICATION_LEADERBOARD_KEY,
  GAMIFICATION_QUERY_KEY,
} from "@/lib/gamification";
import {
  NOTIFICATIONS_FEED_KEY,
  NOTIFICATIONS_QUERY_KEY,
  NOTIFICATIONS_UNREAD_KEY,
} from "@/lib/notifications";
import { WISHLIST_QUERY_KEY } from "@/lib/wishlist";
import {
  BUYER_DASHBOARD_KEY,
  BUYER_INSIGHTS_KEY,
  BUYER_RECS_KEY,
  COLLECTION_LIVE_INSIGHTS_KEY,
  DECKS_KEY,
  INTEL_COLLECTION_KEY,
  INTEL_DECK_PREFIX,
  LIVE_HOME_FEED_KEY,
  MY_SHOP_ORDERS_KEY,
  PLAYER_PROFILE_KEY,
  REC_COLLECTION_KEY,
  REC_DECK_PREFIX,
  SELLER_INTELLIGENCE_KEY,
  SELLER_OPS_V2_KEY,
  SELLER_ORDERS_KEY,
  SHOP_CART_KEY,
  SHOP_ORDER_PREFIX,
  SMART_CART_KEY,
  SOCIAL_UNIFIED_FEED_KEY,
  USER_COLLECTION_INSIGHTS_KEY,
  USER_COLLECTION_KEY,
  USER_COLLECTION_MISSING_PREFIX,
} from "@/lib/query-keys/player";
import { isFeatureEnabled } from "@/lib/feature-flags";

function softInvalidate(qc: QueryClient, queryKey: readonly unknown[]) {
  if (!Array.isArray(queryKey)) return;
  void qc.invalidateQueries({ queryKey: [...queryKey] });
}

/** After collection mutate — value, missing, decks usage, recs, intel, live. */
export function invalidateAfterCollectionMutation(qc: QueryClient): void {
  if (!isFeatureEnabled("PLAYER_JOURNEY_CONTINUITY")) {
    softInvalidate(qc, USER_COLLECTION_KEY);
    softInvalidate(qc, USER_COLLECTION_INSIGHTS_KEY);
    return;
  }
  softInvalidate(qc, USER_COLLECTION_KEY);
  softInvalidate(qc, USER_COLLECTION_INSIGHTS_KEY);
  softInvalidate(qc, USER_COLLECTION_MISSING_PREFIX);
  softInvalidate(qc, COLLECTION_LIVE_INSIGHTS_KEY);
  softInvalidate(qc, INTEL_COLLECTION_KEY);
  softInvalidate(qc, REC_COLLECTION_KEY);
  softInvalidate(qc, DECKS_KEY);
  softInvalidate(qc, INTEL_DECK_PREFIX);
  softInvalidate(qc, REC_DECK_PREFIX);
  softInvalidate(qc, BUYER_DASHBOARD_KEY);
  softInvalidate(qc, WISHLIST_QUERY_KEY);
  softInvalidate(qc, SOCIAL_UNIFIED_FEED_KEY);
  softInvalidate(qc, LIVE_HOME_FEED_KEY);
  softInvalidate(qc, PLAYER_PROFILE_KEY);
  softInvalidate(qc, GAMIFICATION_QUERY_KEY);
}

/**
 * After purchase / payment confirmed —
 * cart → orders → collection → deck → profile → gamification → feed → notifications → live.
 */
export function invalidateAfterPurchase(qc: QueryClient): void {
  softInvalidate(qc, SHOP_CART_KEY);
  softInvalidate(qc, SMART_CART_KEY);
  softInvalidate(qc, MY_SHOP_ORDERS_KEY);
  softInvalidate(qc, SHOP_ORDER_PREFIX);
  softInvalidate(qc, BUYER_DASHBOARD_KEY);
  softInvalidate(qc, BUYER_INSIGHTS_KEY);
  softInvalidate(qc, BUYER_RECS_KEY);

  if (!isFeatureEnabled("PLAYER_JOURNEY_CONTINUITY")) return;

  invalidateAfterCollectionMutation(qc);
  softInvalidate(qc, NOTIFICATIONS_QUERY_KEY);
  softInvalidate(qc, NOTIFICATIONS_FEED_KEY);
  softInvalidate(qc, NOTIFICATIONS_UNREAD_KEY);
  softInvalidate(qc, GAMIFICATION_QUERY_KEY);
  softInvalidate(qc, GAMIFICATION_BADGES_KEY);
  softInvalidate(qc, GAMIFICATION_LEADERBOARD_KEY);
  softInvalidate(qc, SOCIAL_UNIFIED_FEED_KEY);
  softInvalidate(qc, LIVE_HOME_FEED_KEY);
  softInvalidate(qc, PLAYER_PROFILE_KEY);
}

/** After seller fulfillment / sale — ops dashboard + intelligence. */
export function invalidateAfterSellerSale(qc: QueryClient): void {
  softInvalidate(qc, SELLER_ORDERS_KEY);
  softInvalidate(qc, SELLER_OPS_V2_KEY);
  softInvalidate(qc, SELLER_INTELLIGENCE_KEY);
  softInvalidate(qc, ["seller-fulfillment"]);
  softInvalidate(qc, ["seller-order"]);
  softInvalidate(qc, ["seller-inventory"]);
  softInvalidate(qc, ["seller-inventory-dashboard"]);
  softInvalidate(qc, GAMIFICATION_QUERY_KEY);
  if (isFeatureEnabled("PLAYER_JOURNEY_CONTINUITY")) {
    softInvalidate(qc, NOTIFICATIONS_FEED_KEY);
    softInvalidate(qc, NOTIFICATIONS_UNREAD_KEY);
  }
}

/** After wishlist / price alert — notifications + marketplace recs. */
export function invalidateAfterWishlistSignal(qc: QueryClient): void {
  softInvalidate(qc, WISHLIST_QUERY_KEY);
  softInvalidate(qc, NOTIFICATIONS_FEED_KEY);
  softInvalidate(qc, NOTIFICATIONS_UNREAD_KEY);
  softInvalidate(qc, BUYER_RECS_KEY);
  softInvalidate(qc, REC_COLLECTION_KEY);
}

/** Continuity CTAs after checkout — same product, next natural steps. */
export const POST_PURCHASE_CONTINUITY_LINKS = [
  { href: "/marketplace/orders", label: "Meus pedidos" },
  { href: "/colecao", label: "Ver coleção" },
  { href: "/decks", label: "Atualizar decks" },
  { href: "/perfil", label: "Perfil & XP" },
  { href: "/notifications", label: "Notificações" },
  { href: "/loja", label: "Continuar comprando" },
] as const;
