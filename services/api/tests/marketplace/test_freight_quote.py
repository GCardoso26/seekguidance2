"""Testes Sprint 15 — freight quote heurístico."""

from __future__ import annotations

from app.marketplace.freight_quote import _heuristic_quotes, shipping_v2_enabled


def test_heuristic_quotes_include_pickup():
    quotes = _heuristic_quotes(store_count=1, item_count=2)
    assert len(quotes) >= 3
    pickup = next(q for q in quotes if q["id"] == "pickup")
    assert pickup["price_cents"] == 0


def test_heuristic_price_scales_with_items():
    one = _heuristic_quotes(store_count=1, item_count=1)[0]["price_cents"]
    three = _heuristic_quotes(store_count=1, item_count=3)[0]["price_cents"]
    assert three > one


def test_shipping_v2_default_off():
    assert shipping_v2_enabled() is False
