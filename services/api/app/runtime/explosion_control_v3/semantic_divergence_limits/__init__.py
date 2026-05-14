"""Limites de divergência semântica."""

from __future__ import annotations


def semantic_divergence_cap(delta: float, *, max_delta: float = 0.4) -> dict[str, object]:
    return {"within": delta <= max_delta, "delta": delta}
