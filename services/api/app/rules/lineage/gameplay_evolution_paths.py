"""Paths de evolução de gameplay."""

from __future__ import annotations


def evolution_paths(rule_id: str) -> list[str]:
    if "damage" in rule_id:
        return ["damage_on_stack->modern_damage_system"]
    if "legend" in rule_id:
        return ["legend_rule_v1->legend_rule_v2"]
    return [f"{rule_id}->current_form"]
