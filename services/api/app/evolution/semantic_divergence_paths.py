"""Paths de divergência semântica."""

from __future__ import annotations


def divergence_paths(rule_id: str) -> list[str]:
    if "legend" in rule_id:
        return ["legend_rule_v1->legend_rule_v2", "legend_rule_v1->legend_rule_modern"]
    return [f"{rule_id}->stable_branch"]
