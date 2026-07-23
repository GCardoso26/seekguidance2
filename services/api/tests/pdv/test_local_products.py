"""Unit tests — PDV local products domain helpers."""

from __future__ import annotations

import pytest
from fastapi import HTTPException

from app.pdv.local_products import (
    LOCAL_CATEGORIES,
    _validate_payload,
    can_sell_quantity,
    stock_is_infinite,
)


def test_stock_infinite_when_null():
    assert stock_is_infinite(None) is True
    assert stock_is_infinite(0) is False
    assert can_sell_quantity(None, 999) is True
    assert can_sell_quantity(2, 3) is False
    assert can_sell_quantity(5, 3) is True


def test_validate_payload_create_ok():
    payload = _validate_payload(
        {
            "name": "Chocolate",
            "category": "Snack",
            "price_cents": 750,
            "cost_cents": 300,
            "stock": 10,
            "sku": "CHOC-1",
            "barcode": "7891000100103",
            "active": True,
        }
    )
    assert payload["name"] == "Chocolate"
    assert payload["category"] == "Snack"
    assert payload["price_cents"] == 750
    assert payload["stock"] == 10


def test_validate_payload_infinite_stock():
    payload = _validate_payload(
        {
            "name": "Taxa inscrição",
            "category": "Taxa",
            "price_cents": 2000,
            "stock": None,
        }
    )
    assert payload["stock"] is None


def test_validate_payload_rejects_bad_category():
    with pytest.raises(HTTPException) as exc:
        _validate_payload({"name": "X", "category": "Invalid", "price_cents": 100})
    assert exc.value.status_code == 400


def test_local_categories_cover_spec():
    assert "Booster" in LOCAL_CATEGORIES
    assert "Serviço" in LOCAL_CATEGORIES
    assert "Acessório" in LOCAL_CATEGORIES
