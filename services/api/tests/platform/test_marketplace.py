"""Decklists, sales e reviews — suite consolidada."""

from __future__ import annotations

from app.marketplace.decklists import PLATFORM_FEE_PERCENT


class TestMarketplace:
    def test_commission_calculation_30_percent(self):
        price = 2000
        fee = int(price * PLATFORM_FEE_PERCENT / 100)
        seller = price - fee
        assert fee == 600
        assert seller == 1400
        assert seller / price == 0.7

    def test_price_bounds_documented(self):
        assert PLATFORM_FEE_PERCENT == 30
