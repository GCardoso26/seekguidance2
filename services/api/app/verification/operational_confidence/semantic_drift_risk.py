"""Risco de drift semântico."""

from __future__ import annotations


def semantic_drift_risk(drift_metric: float, *, threshold: float = 0.2) -> dict[str, float]:
    return {"risk": max(0.0, drift_metric - threshold), "drift_metric": drift_metric}
