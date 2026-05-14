"""Score agregado de confiança de runtime."""

from __future__ import annotations


def runtime_confidence_score(
    *,
    tracing_ok: bool,
    dlq_rate: float,
    slo_hits: float,
) -> float:
    base = 0.5 + 0.2 * (1.0 if tracing_ok else 0.0) + 0.3 * slo_hits
    penalty = min(0.4, dlq_rate * 2.0)
    return round(max(0.0, min(1.0, base - penalty)), 4)
