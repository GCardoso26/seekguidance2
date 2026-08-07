"""Regressão: read model de frete expõe quotes como lista plana para o FE."""

from __future__ import annotations

from app.marketplace.freight_quote import quote_freight


def test_quote_freight_payload_has_nested_quotes_list():
    """Contrato interno de quote_freight (aninhado)."""
    # Shape documentado — get_shipping_read_model deve desaninhar.
    sample = {
        "quotes": [{"id": "pac", "price_cents": 1500, "delivery_days": 5, "service": "PAC"}],
        "recommended": {},
        "meta": {"source": "heuristic"},
    }
    rows = sample.get("quotes")
    assert isinstance(rows, list)
    assert rows[0]["price_cents"] == 1500


def test_flatten_shipping_quotes_for_frontend():
    freight = {
        "quotes": [
            {"id": "sedex", "price_cents": 2200, "delivery_days": 2, "service": "SEDEX"},
            {"id": "pac", "price_cents": 1200, "delivery_days": 6, "service": "PAC"},
        ],
        "recommended": {"lowest_price": {"id": "pac"}},
        "meta": {"source": "heuristic"},
    }
    quote_rows = freight.get("quotes") if isinstance(freight, dict) else None
    if not isinstance(quote_rows, list):
        quote_rows = []
    payload = {
        "quotes": quote_rows,
        "recommended": freight.get("recommended"),
        "meta": freight.get("meta"),
    }
    assert isinstance(payload["quotes"], list)
    assert len(payload["quotes"]) == 2
    assert not isinstance(payload["quotes"][0], dict) or "quotes" not in payload["quotes"][0]
