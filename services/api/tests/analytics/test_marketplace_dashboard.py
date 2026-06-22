"""Testes do dashboard de marketplace."""

from __future__ import annotations

from app.analytics.marketplace_dashboard import MARKETPLACE_EVENTS


def test_marketplace_events_set():
    assert "card_view" in MARKETPLACE_EVENTS
    assert "purchase" in MARKETPLACE_EVENTS
    assert "listing_create" in MARKETPLACE_EVENTS
    assert len(MARKETPLACE_EVENTS) == 6
