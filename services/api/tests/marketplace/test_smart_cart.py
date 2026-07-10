"""Testes unitários Buyer Experience (Sprint 14)."""

from __future__ import annotations

from app.marketplace.smart_cart import _estimate_shipping_cents, _group_by_store, _score_plan


def test_group_by_store():
    items = [
        {"store_id": "a", "product_id": "1"},
        {"store_id": "a", "product_id": "2"},
        {"store_id": "b", "product_id": "3"},
    ]
    groups = _group_by_store(items)
    assert len(groups["a"]) == 2
    assert len(groups["b"]) == 1


def test_shipping_estimate_increases_with_qty():
    assert _estimate_shipping_cents(1) == 1200
    assert _estimate_shipping_cents(3) > _estimate_shipping_cents(1)


def test_score_plan_lowest_price_prefers_cheaper_total():
    cheap = _score_plan(
        goal="lowest_price",
        products_cents=1000,
        shipping_cents=100,
        store_count=1,
        avg_trust=80,
        sla_days=3,
    )
    expensive = _score_plan(
        goal="lowest_price",
        products_cents=5000,
        shipping_cents=100,
        store_count=1,
        avg_trust=80,
        sla_days=3,
    )
    assert cheap > expensive


def test_score_plan_fewest_stores():
    one = _score_plan(
        goal="fewest_stores",
        products_cents=5000,
        shipping_cents=1200,
        store_count=1,
        avg_trust=70,
        sla_days=4,
    )
    many = _score_plan(
        goal="fewest_stores",
        products_cents=3000,
        shipping_cents=3600,
        store_count=4,
        avg_trust=70,
        sla_days=4,
    )
    assert one > many
