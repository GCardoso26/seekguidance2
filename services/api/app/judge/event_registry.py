"""Central event registry for product analytics (Beta 1.5).

Source of truth for allowlisted event names. Full field specs live in
docs/product/EVENT_REGISTRY.md — this module keeps runtime parity.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Final


@dataclass(frozen=True, slots=True)
class EventDef:
    name: str
    category: str
    version: int
    owner: str
    criticality: str  # p0 | p1 | p2
    retention_days: int
    deprecated: bool = False
    replacement: str | None = None


def _e(
    name: str,
    category: str,
    *,
    owner: str,
    criticality: str = "p1",
    retention_days: int = 400,
    version: int = 1,
    deprecated: bool = False,
    replacement: str | None = None,
) -> EventDef:
    return EventDef(
        name=name,
        category=category,
        version=version,
        owner=owner,
        criticality=criticality,
        retention_days=retention_days,
        deprecated=deprecated,
        replacement=replacement,
    )


# --- Registered events (must match FE emitters + typed backlog) ---

_EVENTS: tuple[EventDef, ...] = (
    # Monetization
    _e("pricing_page_view", "mono", owner="growth", criticality="p0"),
    _e("pricing_toggle", "mono", owner="growth"),
    _e("pricing_cta_click", "mono", owner="growth", criticality="p0"),
    _e("pricing_start_free", "mono", owner="growth"),
    _e("paywall_hit", "mono", owner="growth", criticality="p0"),
    _e("upgrade_modal_open", "mono", owner="growth", criticality="p0"),
    _e("upgrade_modal_close", "mono", owner="growth", criticality="p2"),
    _e("checkout_started", "checkout", owner="product", criticality="p0"),
    _e("checkout_completed", "checkout", owner="growth", criticality="p0"),
    _e("checkout_failed", "checkout", owner="growth", criticality="p0"),
    _e("subscription_cancelled", "mono", owner="growth"),
    _e("subscription_renewed", "mono", owner="growth"),
    # Engagement
    _e("question_asked", "eng", owner="judge", criticality="p2"),
    _e("verdict_shared", "eng", owner="judge", criticality="p2"),
    _e("source_clicked", "eng", owner="judge", criticality="p2"),
    _e("feedback_given", "eng", owner="judge", criticality="p2"),
    _e("favorite_saved", "eng", owner="judge", criticality="p2"),
    _e("game_changed", "eng", owner="product", criticality="p2"),
    _e("search_used", "search", owner="search", criticality="p2", deprecated=True, replacement="search"),
    _e("history_opened", "eng", owner="judge", criticality="p2"),
    _e("tournament_create_started", "eng", owner="judge"),
    _e("tournament_created", "eng", owner="judge"),
    # Tournament Platform (Business Program 2)
    _e("event_created", "tournament", owner="tournament", criticality="p0"),
    _e("ticket_created", "tournament", owner="tournament"),
    _e("ticket_sold", "tournament", owner="tournament", criticality="p0"),
    _e("registration_created", "tournament", owner="tournament", criticality="p0"),
    _e("checkin_completed", "tournament", owner="tournament", criticality="p0"),
    _e("round_started", "tournament", owner="tournament"),
    _e("round_finished", "tournament", owner="tournament"),
    _e("pairing_generated", "tournament", owner="tournament"),
    _e("match_reported", "tournament", owner="tournament", criticality="p0"),
    _e("penalty_applied", "tournament", owner="tournament"),
    _e("tournament_finished", "tournament", owner="tournament", criticality="p0"),
    # Financial Platform (Business Program 3)
    _e("wallet_created", "financial", owner="financial", criticality="p0"),
    _e("wallet_transaction", "financial", owner="financial", criticality="p0"),
    _e("cashback_generated", "financial", owner="financial"),
    _e("cashback_used", "financial", owner="financial"),
    _e("giftcard_created", "financial", owner="financial"),
    _e("giftcard_used", "financial", owner="financial", criticality="p0"),
    _e("escrow_created", "financial", owner="financial", criticality="p0"),
    _e("escrow_released", "financial", owner="financial", criticality="p0"),
    _e("split_created", "financial", owner="financial"),
    _e("settlement_completed", "financial", owner="financial", criticality="p0"),
    _e("payout_requested", "financial", owner="financial", criticality="p0"),
    _e("payout_completed", "financial", owner="financial", criticality="p0"),
    _e("refund_requested", "financial", owner="financial", criticality="p0"),
    _e("refund_completed", "financial", owner="financial", criticality="p0"),
    _e("chargeback_received", "financial", owner="financial", criticality="p0"),
    # Judge
    _e("report_created", "judge", owner="judge"),
    _e("report_resolved", "judge", owner="judge", criticality="p0"),
    _e("ruling_applied", "judge", owner="judge", criticality="p0"),
    _e("deck_validated", "judge", owner="judge"),
    # Marketplace core
    _e("page_view", "buyer", owner="product", criticality="p0", retention_days=180),
    _e("card_view", "buyer", owner="marketplace", criticality="p0"),
    _e("search", "search", owner="search", criticality="p0"),
    _e("add_to_cart", "buyer", owner="marketplace", criticality="p0"),
    _e("purchase", "checkout", owner="marketplace", criticality="p0", retention_days=730),
    _e("listing_create", "seller", owner="seller", criticality="p0"),
    # Buyer experience
    _e("wishlist_add", "wish", owner="buyer"),
    _e("wishlist_remove", "wish", owner="buyer", criticality="p2"),
    _e("wishlist_created", "wish", owner="buyer", criticality="p0"),
    _e("wishlist_shared", "wish", owner="buyer", criticality="p0"),
    _e("wishlist_converted", "wish", owner="buyer", criticality="p0"),
    _e("shipping_quote", "checkout", owner="buyer"),
    _e("freight_selected", "checkout", owner="buyer"),
    _e("gallery_mode", "perf_ux", owner="frontend", criticality="p2", retention_days=90),
    _e("image_retry", "perf_ux", owner="frontend", criticality="p2", retention_days=90),
    _e("image_failure", "perf_ux", owner="frontend", retention_days=90),
    _e("buyer_ai_used", "buyer", owner="buyer"),
    _e("search_converted", "search", owner="search"),
    _e("smart_cart_used", "buyer", owner="buyer"),
    _e("cart_abandon_hint", "buyer", owner="buyer", retention_days=180),
    _e("recommendation_click", "buyer", owner="buyer"),
    _e("buyer_insight_click", "buyer", owner="buyer", criticality="p2"),
    _e("smart_cart_goal", "buyer", owner="buyer"),
    _e("deck_shop_open", "deck", owner="deck", criticality="p0"),
    _e("collection_import", "coll", owner="product"),
    _e("time_to_purchase_ms", "buyer", owner="product"),
    # Previously orphan FE emitters (now registered)
    _e("announce_card_click", "seller", owner="seller", criticality="p2", retention_days=180),
    _e("card_dwell_ms", "buyer", owner="marketplace", retention_days=180),
    _e("card_buy_click", "buyer", owner="marketplace", criticality="p0"),
    _e("card_add_to_cart", "buyer", owner="marketplace", criticality="p0"),
    # North Star LPC funnel (R1 — docs/product/LPC_ANALYTICS_SPEC.md)
    _e("seller_listing_published", "seller", owner="marketplace", criticality="p0"),
    _e("buyer_card_open", "buyer", owner="marketplace", criticality="p0"),
    _e("buyer_offers_viewed", "buyer", owner="marketplace", criticality="p0"),
    _e("buyer_add_to_cart", "buyer", owner="marketplace", criticality="p0"),
    # Customer Conversion First funnel
    _e("search_product_click", "buyer", owner="marketplace", criticality="p0"),
    _e("search_without_products", "buyer", owner="marketplace", criticality="p0"),
    _e("search_abandonment", "buyer", owner="marketplace"),
    _e("home_product_ctr", "buyer", owner="marketplace", criticality="p0"),
    _e("category_ctr", "buyer", owner="marketplace", criticality="p0"),
    _e("marketplace_ctr", "buyer", owner="marketplace", criticality="p0"),
    # Top Movers (Fase 1.4)
    _e("top_movers_open", "buyer", owner="marketplace", criticality="p0"),
    _e("top_movers_filter", "buyer", owner="marketplace"),
    _e("top_movers_sort", "buyer", owner="marketplace"),
    _e("top_movers_card_open", "buyer", owner="marketplace", criticality="p0"),
    _e("top_movers_buy_click", "buyer", owner="marketplace", criticality="p0"),
    _e("top_movers_compare", "buyer", owner="marketplace", criticality="p2"),
)

EVENT_REGISTRY: Final[dict[str, EventDef]] = {e.name: e for e in _EVENTS}

ALL_ANALYTICS_EVENTS: Final[frozenset[str]] = frozenset(EVENT_REGISTRY.keys())

SUPPORTED_SCHEMA_VERSIONS: Final[frozenset[int]] = frozenset({1})

CRITICAL_IDEMPOTENT_EVENTS: Final[frozenset[str]] = frozenset(
    {
        "purchase",
        "checkout_started",
        "checkout_completed",
        "checkout_failed",
        "listing_create",
        "wishlist_shared",
        "add_to_cart",
        "wishlist_converted",
    }
)

# Keep exact historical monetization set for metrics SQL filters
MONETIZATION_EVENTS: Final[frozenset[str]] = frozenset(
    {
        "pricing_page_view",
        "pricing_toggle",
        "pricing_cta_click",
        "pricing_start_free",
        "paywall_hit",
        "upgrade_modal_open",
        "upgrade_modal_close",
        "checkout_started",
        "checkout_completed",
        "checkout_failed",
        "subscription_cancelled",
        "subscription_renewed",
    }
)

ENGAGEMENT_EVENTS: Final[frozenset[str]] = frozenset(
    {
        "question_asked",
        "verdict_shared",
        "source_clicked",
        "feedback_given",
        "favorite_saved",
        "game_changed",
        "search_used",
        "history_opened",
        "tournament_create_started",
        "tournament_created",
    }
)

JUDGE_ASSISTANT_EVENTS: Final[frozenset[str]] = frozenset(
    {
        "report_created",
        "report_resolved",
        "ruling_applied",
        "deck_validated",
    }
)

MARKETPLACE_EVENTS: Final[frozenset[str]] = frozenset(
    {
        "page_view",
        "card_view",
        "search",
        "add_to_cart",
        "purchase",
        "listing_create",
        "seller_listing_published",
        "buyer_card_open",
        "buyer_offers_viewed",
        "buyer_add_to_cart",
    }
)

BUYER_EXPERIENCE_EVENTS: Final[frozenset[str]] = frozenset(
    {
        "wishlist_add",
        "wishlist_remove",
        "wishlist_created",
        "wishlist_shared",
        "wishlist_converted",
        "shipping_quote",
        "freight_selected",
        "gallery_mode",
        "image_retry",
        "image_failure",
        "buyer_ai_used",
        "search_converted",
        "smart_cart_used",
        "cart_abandon_hint",
        "recommendation_click",
        "buyer_insight_click",
        "smart_cart_goal",
        "deck_shop_open",
        "collection_import",
        "time_to_purchase_ms",
        "announce_card_click",
        "card_dwell_ms",
        "card_buy_click",
        "card_add_to_cart",
        "top_movers_open",
        "top_movers_filter",
        "top_movers_sort",
        "top_movers_card_open",
        "top_movers_buy_click",
        "top_movers_compare",
    }
)
