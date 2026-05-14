"""Score de incerteza semântica."""

from __future__ import annotations


def uncertainty_score(ambiguities: list[str], token_count: int) -> float:
    base = 0.02 * len(ambiguities)
    if token_count > 120:
        base += 0.03
    return max(0.0, min(1.0, base))
