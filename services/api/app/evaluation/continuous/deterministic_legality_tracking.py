"""Legality determinística (gate leve)."""

from __future__ import annotations


def deterministic_legality_gate(seed: str, outcome_hash: str) -> dict[str, object]:
    return {"stable": bool(seed) and bool(outcome_hash), "seed": seed, "outcome_hash": outcome_hash}
