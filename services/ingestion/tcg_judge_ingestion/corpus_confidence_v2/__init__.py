"""Confiança de corpus V2 (juiz, arquivo, replay, ambiguidade)."""

from __future__ import annotations

from typing import Any


def corpus_confidence_v2(
    *,
    judge_confidence: float,
    archive_reliability: float,
    replay_reproducibility: float,
    contradiction_density: float,
    semantic_ambiguity: float,
    cross_version_stability: float,
) -> dict[str, float]:
    base = (
        0.2 * judge_confidence
        + 0.2 * archive_reliability
        + 0.2 * replay_reproducibility
        + 0.15 * (1.0 - min(1.0, contradiction_density))
        + 0.15 * (1.0 - min(1.0, semantic_ambiguity))
        + 0.1 * cross_version_stability
    )
    return {"score": round(max(0.0, min(1.0, base)), 4)}
