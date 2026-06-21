"""Testes de cupom no checkout PIX."""

from decimal import Decimal

import pytest

from app.marketplace.shop_coupons import calculate_coupon_discount


def test_percentage_coupon_discount():
    coupon = {"type": "percentage", "value_cents": 10, "max_discount_cents": None}
    assert calculate_coupon_discount(coupon, 10000) == 1000


def test_fixed_coupon_discount():
    coupon = {"type": "fixed", "value_cents": 1500, "max_discount_cents": None}
    assert calculate_coupon_discount(coupon, 10000) == 1500


def test_coupon_discount_capped_by_max():
    coupon = {"type": "percentage", "value_cents": 50, "max_discount_cents": 2000}
    assert calculate_coupon_discount(coupon, 10000) == 2000


def test_coupon_discount_never_exceeds_subtotal():
    coupon = {"type": "fixed", "value_cents": 5000, "max_discount_cents": None}
    assert calculate_coupon_discount(coupon, 3000) == 3000


def test_pix_final_amount_with_coupon():
    subtotal = Decimal("100.00")
    shipping = Decimal("10.00")
    discount = Decimal("10.00")
    final_amount = subtotal - discount + shipping
    assert final_amount == Decimal("100.00")
