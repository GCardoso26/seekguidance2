"""Riftbound — camada adaptativa (sem equivalência forte com outros TCGs)."""

from __future__ import annotations

from typing import Any


def unknown_mechanic_negotiation_stub(signal: str) -> dict[str, Any]:
    return {"signal": signal, "strategy": "defer_to_corpus_soft", "hard_equivalence": False}


def adaptive_placeholder_confidence(hits: int) -> float:
    return min(1.0, 0.25 + 0.05 * hits)
