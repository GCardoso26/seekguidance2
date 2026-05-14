"""Balanceamento de carga de workers."""

from __future__ import annotations

from typing import Any


def worker_load_balancing_stub(skew: float) -> dict[str, Any]:
    return {"skew": skew, "rebalance": skew > 0.3, "assistant_notes": ["Adaptive runtime scaling input."]}
