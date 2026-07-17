"""Regressão P0: oferta errada na PDP e mismatch catalog_card_id no carrinho."""

from __future__ import annotations

import inspect

import pytest
from app.catalog.detail_service import _fetch_store_listings, _store_product_matches_card
from app.marketplace.shop_cart import _assert_product_matches_expected_card
from fastapi import HTTPException


def test_store_product_matches_card_accepts_null_and_same_id():
    card = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
    assert _store_product_matches_card({"catalog_card_id": None}, card) is True
    assert _store_product_matches_card({"catalog_card_id": card}, card) is True


def test_store_product_matches_card_rejects_other_card():
    card_a = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
    card_b = "11111111-2222-3333-4444-555555555555"
    assert _store_product_matches_card({"catalog_card_id": card_b}, card_a) is False


def test_fetch_store_listings_sql_does_not_match_by_game_alone():
    src = inspect.getsource(_fetch_store_listings)
    assert "sp.tcg_id = :game_code" not in src
    assert "catalog_card_id = CAST(:card_id AS uuid)" in src
    assert "sp.name ILIKE :pattern" in src


def test_assert_product_matches_expected_card_raises_409():
    with pytest.raises(HTTPException) as exc:
        _assert_product_matches_expected_card(
            {"catalog_card_id": "11111111-2222-3333-4444-555555555555"},
            "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
        )
    assert exc.value.status_code == 409


def test_assert_product_matches_expected_card_allows_null_catalog():
    _assert_product_matches_expected_card(
        {"catalog_card_id": None},
        "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    )


def test_get_cart_uses_on_conflict():
    from app.marketplace import shop_cart

    src = inspect.getsource(shop_cart.get_cart)
    assert "ON CONFLICT (user_id) DO NOTHING" in src
