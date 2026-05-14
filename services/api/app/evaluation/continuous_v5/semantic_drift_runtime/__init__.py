"""Drift semântico em runtime."""

from __future__ import annotations


def semantic_drift_runtime(score: float, *, limit: float = 0.2) -> dict[str, object]:
    return {"drift": score > limit, "score": score}
