"""Tests for Beta 1.5 event integrity: registry parity + ingest accounting."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock

import pytest
from app.judge import analytics_events as ae
from app.judge.event_registry import ALL_ANALYTICS_EVENTS, EVENT_REGISTRY

# Mirrors FE union + orphan emitters audited in Beta 1.5
FE_EMITTED_OR_TYPED = frozenset(
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
        "report_created",
        "report_resolved",
        "ruling_applied",
        "deck_validated",
        "page_view",
        "card_view",
        "search",
        "add_to_cart",
        "purchase",
        "listing_create",
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


def test_registry_covers_frontend_surface():
    missing = FE_EMITTED_OR_TYPED - ALL_ANALYTICS_EVENTS
    assert not missing, f"Registry missing FE events: {sorted(missing)}"


def test_registry_unique_names():
    assert len(EVENT_REGISTRY) == len(ALL_ANALYTICS_EVENTS)


@pytest.mark.asyncio
async def test_unknown_event_goes_to_dlq_not_silent_drop():
    session = AsyncMock()
    session.execute = AsyncMock(return_value=MagicMock())
    session.commit = AsyncMock()
    session.rollback = AsyncMock()

    result = await ae.record_analytics_events(
        session,
        [{"event": "totally_unknown_xyz", "timestamp": "2026-07-14T12:00:00Z", "properties": {}}],
        origin="test",
    )
    assert result["persisted"] == 0
    assert result["dead_lettered"] == 1
    assert result["lost"] == 0
    assert result["ok"] is True
    assert result["details"][0]["reason"] == "unknown_event"


@pytest.mark.asyncio
async def test_known_wishlist_event_persists():
    session = AsyncMock()
    session.execute = AsyncMock(return_value=MagicMock())
    session.commit = AsyncMock()
    session.rollback = AsyncMock()

    result = await ae.record_analytics_events(
        session,
        [
            {
                "event": "wishlist_created",
                "timestamp": "2026-07-14T12:00:00Z",
                "event_schema_version": 1,
                "anonymous_id": "a1",
                "properties": {"name": "main"},
            }
        ],
    )
    assert result["persisted"] == 1
    assert result["dead_lettered"] == 0
    assert result["ok"] is True
    assert session.execute.await_count >= 1
