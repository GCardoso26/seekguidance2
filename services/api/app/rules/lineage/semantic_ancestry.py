"""Inferência de ancestralidade semântica."""

from __future__ import annotations


def infer_ancestry(rule_id: str) -> list[str]:
    if "damage" in rule_id:
        return ["damage_on_stack"]
    if "legend" in rule_id:
        return ["legend_rule_v1"]
    return ["legacy_rule_base"]
