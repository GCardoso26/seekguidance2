"""Regressão cross-TCG (spread de scores)."""

from __future__ import annotations

from typing import Any


def cross_tcg_regression_tracking(per_game: dict[str, float]) -> dict[str, Any]:
    vals = sorted(per_game.values())
    spread = (vals[-1] - vals[0]) if len(vals) >= 2 else 0.0
    return {"regression_signal": spread > 0.2, "spread": round(spread, 4)}
