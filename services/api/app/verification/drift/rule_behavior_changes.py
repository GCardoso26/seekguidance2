"""Detecção de mudanças comportamentais de regras."""

from __future__ import annotations

from typing import Any


def detect_rule_behavior_changes(rule_id: str, old_hash: str, new_hash: str) -> dict[str, Any]:
    changed = old_hash != new_hash
    return {
        "rule_id": rule_id,
        "version_change_detected": changed,
        "severity": "high" if changed else "none",
    }
