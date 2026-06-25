"""Testes do módulo de escrow."""

from app.marketplace.shop_escrow import calculate_escrow_fees


def test_calculate_escrow_fees():
    fees = calculate_escrow_fees(10_000, 500)
    assert fees["escrow_fee_cents"] == 300
    assert fees["total_cents"] == 10_800
    assert fees["seller_release_cents"] == 10_200
