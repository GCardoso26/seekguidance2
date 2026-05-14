"""Estimativa de ambiguidade a partir de conflitos e cobertura lexical."""

from __future__ import annotations

from app.reasoning.types import ConflictItem


def ambiguity_score(conflicts: list[ConflictItem], n_hits: int) -> float:
    base = min(1.0, 0.18 * len(conflicts))
    cov = 0.12 if n_hits < 3 else 0.0
    hi = sum(1 for c in conflicts if c.severity == "high")
    base += min(0.35, 0.08 * hi)
    return min(1.0, base + cov)
