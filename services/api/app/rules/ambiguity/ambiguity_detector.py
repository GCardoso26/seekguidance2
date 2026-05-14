"""Detector agregado de ambiguidade semântica."""

from __future__ import annotations

from typing import Any

from app.rules.ambiguity.interpretation_divergence import interpretation_divergence
from app.rules.ambiguity.judge_conflict_detection import judge_interpretation_risk
from app.rules.ambiguity.semantic_uncertainty import uncertainty_score
from app.rules.ambiguity.wording_conflicts import detect_wording_conflicts


def detect_ambiguities(text: str, tokens: list[str]) -> dict[str, Any]:
    ambiguities = detect_wording_conflicts(text)
    divergences = interpretation_divergence(ambiguities)
    uncertainty = uncertainty_score(ambiguities, len(tokens))
    risk = judge_interpretation_risk(uncertainty, len(divergences))
    return {
        "ambiguities_detected": ambiguities,
        "semantic_uncertainty": round(uncertainty, 4),
        "judge_interpretation_risk": round(risk, 4),
        "interpretation_divergence": divergences,
    }
