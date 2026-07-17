"""Regressão: reserved_stock da própria sessão não deve bloquear checkout."""

from __future__ import annotations

from app.marketplace.shop_checkout import _locked_qty_credit


def test_locked_qty_credit_sums_per_product():
    credit = _locked_qty_credit(
        {
            "locked_items": [
                {"product_id": "p1", "quantity": 2},
                {"product_id": "p1", "quantity": 1},
                {"product_id": "p2", "quantity": 4},
            ]
        }
    )
    assert credit == {"p1": 3, "p2": 4}


def test_available_after_own_reserve_allows_full_stock():
    stock = 4
    reserved_after_initiate = 4  # bought all units
    credit = _locked_qty_credit({"locked_items": [{"product_id": "merida", "quantity": 4}]})
    available = stock - reserved_after_initiate + credit.get("merida", 0)
    assert available == 4
    assert 4 <= available


def test_available_without_credit_falsely_fails():
    stock = 4
    reserved_after_initiate = 4
    available_wrong = stock - reserved_after_initiate
    assert available_wrong == 0  # bug antigo
