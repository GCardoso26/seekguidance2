"""Predição de convergência (heurística)."""

from __future__ import annotations


def convergence_prediction(pressure: float, stability: float) -> dict[str, object]:
    p = max(0.0, min(1.0, pressure))
    s = max(0.0, min(1.0, stability))
    likely = s > 0.75 and p < 0.6
    return {"likely": likely, "pressure": p, "stability": s}
