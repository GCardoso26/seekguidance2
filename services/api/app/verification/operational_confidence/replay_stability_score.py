"""Score de estabilidade de replay."""

from __future__ import annotations


def replay_stability_score(*, deterministic: bool, divergence: float) -> float:
    d = max(0.0, min(1.0, divergence))
    base = 0.85 if deterministic else 0.45
    return round(max(0.0, min(1.0, base - 0.5 * d)), 4)
