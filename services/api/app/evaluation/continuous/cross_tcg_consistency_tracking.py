"""Consistência cross-TCG (métricas agregadas, sem equivalência forte)."""

from __future__ import annotations

from typing import Any


def cross_tcg_consistency_index(per_game_scores: dict[str, float]) -> dict[str, Any]:
    vals = sorted(per_game_scores.values())
    spread = (vals[-1] - vals[0]) if len(vals) >= 2 else 0.0
    return {"spread": round(spread, 4), "games": sorted(per_game_scores.keys())}
