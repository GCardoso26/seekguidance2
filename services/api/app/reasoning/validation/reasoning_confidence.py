"""Agregação de confiança do raciocínio (separada da confiança do retrieval)."""

from __future__ import annotations

from app.reasoning.types import ConflictItem


def reasoning_confidence(
    *,
    n_hits: int,
    conflicts: list[ConflictItem],
    reasoning_valid: bool,
    ambiguity: float,
) -> float:
    score = 0.55 + min(0.25, 0.03 * n_hits)
    score -= min(0.35, 0.07 * len(conflicts))
    score -= 0.4 * ambiguity
    if not reasoning_valid:
        score -= 0.2
    return max(0.05, min(0.98, score))
