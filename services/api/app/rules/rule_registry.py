"""Registo de regras estruturadas: builtins + hits."""

from __future__ import annotations

from typing import Any

from app.rules.rule_parser import parse_hits_to_rules, parse_rule_path
from app.rules.structured_rules import StructuredRule


def builtin_rules_mtg() -> dict[str, StructuredRule]:
    r603_3b = parse_rule_path("603.3b", "mtg")
    if r603_3b is None:
        return {}
    r603_3b = StructuredRule(
        rule_id="603.3b",
        game="mtg",
        rule_type="trigger_resolution",
        timing_window="post_resolution",
        precedence=["apnap_if_simultaneous"],
        dependencies=["603.1", "603.2"],
        constraints=r603_3b.constraints,
        state_effects=r603_3b.state_effects,
        zone_effects=r603_3b.zone_effects,
        interaction_semantics=["trigger_wait_then_stack"],
    )
    return {"603.3b": r603_3b}


def get_structured_rules(game_slug: str, hits: list) -> list[dict[str, Any]]:
    builtins: dict[str, StructuredRule] = {}
    if game_slug == "mtg":
        builtins = builtin_rules_mtg()
    from_hits = parse_hits_to_rules(hits, game_slug)
    merged: dict[str, StructuredRule] = {r.rule_id: r for r in from_hits}
    for k, v in builtins.items():
        merged[k] = v
    return [r.to_dict() for r in merged.values()]
