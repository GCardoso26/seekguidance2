"""Tendência de scores de legalidade (histórico sintético)."""

from __future__ import annotations

from typing import Any


def legality_trend_stub(scores: list[float]) -> dict[str, Any]:
    if not scores:
        return {"trend": "flat", "delta": 0.0}
    delta = scores[-1] - scores[0]
    trend = "up" if delta > 0.01 else "down" if delta < -0.01 else "flat"
    return {"trend": trend, "delta": delta, "assistant_notes": ["Judge assistant: tendência ≠ ground truth absoluto."]}
