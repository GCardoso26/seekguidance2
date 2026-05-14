"""Detector agregado de semantic drift."""

from __future__ import annotations

from typing import Any

from app.verification.drift.replay_divergence import replay_diverged
from app.verification.drift.rule_behavior_changes import detect_rule_behavior_changes
from app.verification.drift.version_regression_analysis import regression_risk


def detect_semantic_drift(rule_id: str, old_hash: str, new_hash: str, semantic_divergence: float) -> dict[str, Any]:
    changed = replay_diverged(old_hash, new_hash)
    behavior = detect_rule_behavior_changes(rule_id, old_hash, new_hash)
    risk = regression_risk(changed, semantic_divergence)
    return {
        "version_change_detected": changed,
        "rule_behavior": behavior,
        **risk,
    }
