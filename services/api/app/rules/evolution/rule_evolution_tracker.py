"""Tracker agregado de evolução semântica."""

from __future__ import annotations

from typing import Any

from app.rules.evolution.gameplay_behavior_changes import behavior_change_score
from app.rules.evolution.semantic_regression_detection import runtime_semantic_stability
from app.rules.evolution.semantic_rule_diff import semantic_rule_diff


def track_rule_evolution(old: dict[str, Any], new: dict[str, Any]) -> dict[str, Any]:
    diff = semantic_rule_diff(old, new)
    bscore = behavior_change_score(bool(diff["semantic_behavior_change"]))
    return {
        "semantic_behavior_change": bool(diff["semantic_behavior_change"]),
        "runtime_semantic_stability": runtime_semantic_stability(bscore),
    }
