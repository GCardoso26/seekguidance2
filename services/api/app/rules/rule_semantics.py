"""Semântica formal leve por identificador de regra (não substitui o CR completo)."""

from __future__ import annotations

import re

from app.rules.structured_rules import RuleType, StructuredRule


def _infer_type_from_path(rule_id: str, game: str) -> RuleType:
    rid = rule_id.strip()
    if game == "mtg":
        if rid.startswith("603"):
            return "trigger_resolution"
        if rid.startswith("614"):
            return "replacement_effect"
        if rid.startswith("704"):
            return "state_based_action"
        if rid.startswith("613"):
            return "layer_continuous"
        if rid.startswith("117"):
            return "priority_timing"
        if rid.startswith("405") or rid.startswith("500"):
            return "stack_interaction"
    if game == "yugioh":
        return "chain_interaction"
    if game == "pokemon":
        return "trigger_resolution"
    return "unknown"


def _timing_window(rule_type: RuleType, rule_id: str) -> str | None:
    if rule_type == "state_based_action":
        return "post_sba_window"
    if rule_type == "trigger_resolution":
        m = re.match(r"^603\.(\d+)", rule_id)
        if m and m.group(1) in {"1", "2", "3"}:
            return "post_resolution"
        return "post_resolution"
    if rule_type == "replacement_effect":
        return "event_replacement_window"
    return None


def build_semantics(rule: StructuredRule) -> StructuredRule:
    rt = rule.rule_type if rule.rule_type != "unknown" else _infer_type_from_path(rule.rule_id, rule.game)
    tw = rule.timing_window or _timing_window(rt, rule.rule_id)
    return StructuredRule(
        rule_id=rule.rule_id,
        game=rule.game,
        rule_type=rt,
        timing_window=tw,
        precedence=list(rule.precedence),
        dependencies=list(rule.dependencies),
        constraints=list(rule.constraints),
        state_effects=list(rule.state_effects),
        zone_effects=list(rule.zone_effects),
        interaction_semantics=list(rule.interaction_semantics),
        version_label=rule.version_label,
        raw_excerpt=rule.raw_excerpt,
    )
