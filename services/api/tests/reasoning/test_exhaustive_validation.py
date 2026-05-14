"""Exhaustive validation stubs."""

from __future__ import annotations

from app.reasoning.exhaustive_validation import bounded_timing_orders, segoc_pairing_stub


def test_bounded_orders() -> None:
    assert len(bounded_timing_orders(["a", "b"])) == 2


def test_segoc_stub() -> None:
    out = segoc_pairing_stub(["m1"], ["o1"])
    assert out["mandatory"] == ["m1"]
