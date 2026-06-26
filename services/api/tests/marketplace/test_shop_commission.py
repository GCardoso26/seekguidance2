"""Testes Sprint 1 — comissão marketplace e metadata de transfer."""

from __future__ import annotations

from app.marketplace.shop_commission import platform_fee_cents, store_receives_cents
from app.marketplace.shop_orders import _parse_store_transfer_amounts


def test_platform_fee_default_rate():
    assert platform_fee_cents(10_000) == 1500
    assert store_receives_cents(10_000) == 8500


def test_platform_fee_custom_rate():
    assert platform_fee_cents(10_000, 0.10) == 1000
    assert store_receives_cents(10_000, 0.10) == 9000


def test_parse_store_transfer_splits_metadata():
    metadata = {
        "store_transfer_splits": '{"store-a": 8500, "store-b": 4250}',
        "store_splits": '{"store-a": 10000, "store-b": 5000}',
    }
    amounts = _parse_store_transfer_amounts(metadata)
    assert amounts == {"store-a": 8500, "store-b": 4250}


def test_parse_store_transfer_fallback_from_gross():
    metadata = {"store_splits": '{"store-a": 10000}'}
    amounts = _parse_store_transfer_amounts(metadata)
    assert amounts == {"store-a": 8500}
