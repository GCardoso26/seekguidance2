"""Drift histórico de legalidade (proxy)."""

from __future__ import annotations


def historical_legality_drift_stub(score_old: float, score_new: float) -> dict[str, float]:
    return {"delta": round(score_new - score_old, 4)}
