"""Pontuação de consistência de runtime."""

from __future__ import annotations

from typing import Any


def runtime_consistency_scoring_stub(matches: int, total: int) -> dict[str, Any]:
    score = matches / total if total else 1.0
    drift = 1.0 - score
    return {"score": score, "runtime_drift_history": [drift]}
