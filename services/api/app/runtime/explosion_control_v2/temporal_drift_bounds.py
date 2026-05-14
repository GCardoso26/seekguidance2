"""Limites de drift temporal (bounds declarativos)."""

from __future__ import annotations


def temporal_drift_bound(clock_skew_ms: float, *, max_skew_ms: float = 500.0) -> dict[str, object]:
    ok = abs(clock_skew_ms) <= max_skew_ms
    return {"ok": ok, "clock_skew_ms": clock_skew_ms, "max_skew_ms": max_skew_ms}
