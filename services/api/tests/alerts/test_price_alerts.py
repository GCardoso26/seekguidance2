"""Testes do serviço de alertas de preço."""

from __future__ import annotations

from app.alerts.price_alerts import _alert_payload


def test_alert_payload_normalizes_fields():
    row = {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "card_id": "660e8400-e29b-41d4-a716-446655440001",
        "card_name": "Lightning Bolt",
        "set_name": "MH3",
        "card_image_url": "https://example.com/bolt.jpg",
        "target_price_cents": 250,
        "price_condition": "below",
        "target_card_condition": "NM",
        "target_foil": False,
        "status": "active",
        "email_notified": False,
        "push_notified": False,
        "created_at": "2026-01-01T00:00:00Z",
        "expires_at": "2026-04-01T00:00:00Z",
        "triggered_at": None,
    }
    payload = _alert_payload(row, current_cents=300)
    assert payload["cardName"] == "Lightning Bolt"
    assert payload["targetPrice"] == 2.5
    assert payload["condition"] == "below"
    assert payload["currentPrice"] == 3.0
    assert payload["priceDifference"] == 20.0
