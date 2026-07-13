"""Unit tests — Inventory health + export helpers (Sprint 17)."""

from __future__ import annotations

from app.marketplace.seller_inventory_health import average_health, compute_item_health, enrich_items_with_health


def test_health_penalizes_missing_image_and_stock():
    h = compute_item_health(
        {"title": "Card", "quantity": 0, "price_cents": 1000, "image_url": None, "language": "pt"}
    )
    assert h["score"] < 100
    assert "missing_image" in h["flags"]
    assert "out_of_stock" in h["flags"]
    assert h["band"] in {"warn", "critical"}


def test_health_healthy_item():
    h = compute_item_health(
        {
            "title": "Pikachu EX",
            "quantity": 10,
            "price_cents": 2500,
            "image_url": "https://cdn/x.png",
            "language": "pt",
            "status": "active",
            "kind": "cards",
            "set_code": "SVI",
        }
    )
    assert h["score"] >= 80
    assert h["band"] == "healthy"


def test_enrich_and_average():
    items = enrich_items_with_health(
        [
            {"title": "A", "quantity": 5, "price_cents": 100, "image_url": "x", "language": "pt"},
            {"title": "B", "quantity": 0, "price_cents": 0, "image_url": None, "language": ""},
        ]
    )
    assert "health" in items[0]
    avg = average_health(items)
    assert 0 <= avg <= 100
