"""update_coupon: activate/deactivate e campos editáveis."""

from __future__ import annotations

import pytest
from fastapi import HTTPException

from app.marketplace.shop_coupons import calculate_coupon_discount


def test_calculate_percentage_capped_by_order_total():
    discount = calculate_coupon_discount(
        {"type": "percentage", "value_cents": 50, "max_discount_cents": None},
        1000,
    )
    assert discount == 500


def test_calculate_fixed_capped_by_order_total():
    discount = calculate_coupon_discount(
        {"type": "fixed", "value_cents": 2000, "max_discount_cents": None},
        1500,
    )
    assert discount == 1500


@pytest.mark.asyncio
async def test_update_coupon_rejects_empty_patch(monkeypatch):
    from app.marketplace import shop_coupons

    class FakeSession:
        async def execute(self, *_a, **_k):
            class R:
                def mappings(self):
                    class M:
                        def first(self):
                            return {"id": "store"}

                    return M()

            return R()

        async def commit(self):
            return None

    with pytest.raises(HTTPException) as exc:
        await shop_coupons.update_coupon(
            FakeSession(),  # type: ignore[arg-type]
            "store-1",
            "owner-1",
            "coupon-1",
        )
    assert exc.value.status_code == 400
