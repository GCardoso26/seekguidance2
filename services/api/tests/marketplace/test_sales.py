"""Testes do marketplace."""

from __future__ import annotations

from app.marketplace.decklists import PLATFORM_FEE_PERCENT


class TestMarketplaceSales:
    def test_platform_fee_30_percent(self):
        price = 1500
        fee = int(price * PLATFORM_FEE_PERCENT / 100)
        seller = price - fee
        assert fee == 450
        assert seller == 1050
        assert seller / price == 0.7
