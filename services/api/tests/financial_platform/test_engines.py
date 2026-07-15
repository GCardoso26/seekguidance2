"""Split + cashback + gift card policy."""

from __future__ import annotations

import pytest
from app.financial_platform.services.money_engines import (
    CashbackService,
    GiftCardService,
    SplitService,
)
from fastapi import HTTPException


def test_split_apply_sums_to_amount() -> None:
    svc = SplitService(session=None)  # type: ignore[arg-type]
    lines = [
        {"beneficiary": "marketplace", "percent_bps": 1000},
        {"beneficiary": "store", "percent_bps": 9000},
    ]
    out = svc.apply(10_000, lines)
    assert sum(x["amount_cents"] for x in out) == 10_000


def test_cashback_compute_not_checkout() -> None:
    svc = CashbackService(session=None)  # type: ignore[arg-type]
    assert svc.compute(10_000, 500) == 500  # 5%


def test_gift_transfer_forbidden() -> None:
    svc = GiftCardService(session=None)  # type: ignore[arg-type]
    with pytest.raises(HTTPException) as exc:
        svc.transfer_forbidden()
    assert exc.value.status_code == 400
