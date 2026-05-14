"""Comparação de replay ao longo do tempo."""

from __future__ import annotations


def replay_semantic_differences(period: str) -> list[str]:
    if period == "2009":
        return ["combat_damage_stack_enabled", "legend_rule_legacy_behavior"]
    if period == "modern":
        return ["combat_damage_stack_removed"]
    return []
