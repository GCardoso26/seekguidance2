"""Testes de fluxo escrow (unitário, sem DB)."""

from app.marketplace.shop_escrow import calculate_escrow_fees


def test_escrow_fee_calculation():
    fees = calculate_escrow_fees(10_000, shipping_cents=500)
    assert fees["amount_cents"] == 10_000
    assert fees["shipping_cents"] == 500
    assert fees["escrow_fee_cents"] == 300
    assert fees["total_cents"] == 10_500 + 300
    assert fees["seller_release_cents"] == 10_500 - 300


def test_escrow_fee_zero_amount():
    fees = calculate_escrow_fees(0)
    assert fees["escrow_fee_cents"] == 0
    assert fees["seller_release_cents"] == 0
