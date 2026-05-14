"""Métricas de estabilidade / validação determinística."""

from __future__ import annotations

from typing import Any


def deterministic_stability_score(report: dict[str, Any]) -> float:
    v4 = report.get("constraint_resolution") or report.get("reasoning_v4") or {}
    if not v4:
        return 0.0
    base = float(v4.get("deterministic_confidence", 0.0))
    if v4.get("valid_chain"):
        return min(1.0, base + 0.04)
    return base


def invalid_chain_rejection_rate(results: list[bool]) -> float:
    if not results:
        return 0.0
    return sum(1 for r in results if r) / len(results)
