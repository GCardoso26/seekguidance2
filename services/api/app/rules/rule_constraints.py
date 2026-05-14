"""Constraints textuais / tags associados a tipos de regra."""

from __future__ import annotations

from app.rules.structured_rules import RuleType


def infer_constraints(rule_type: RuleType) -> list[str]:
    if rule_type == "replacement_effect":
        return ["must_apply_before_sba_for_same_event", "one_shot_per_applicable_event"]
    if rule_type == "state_based_action":
        return ["checked_after_full_resolution_step", "no_player_priority_during_sba_sequence"]
    if rule_type == "trigger_resolution":
        return ["apnap_order_if_simultaneous", "zone_legality_required"]
    if rule_type == "chain_interaction":
        return ["spell_speed_legality", "chain_build_order_segoc_if_ygo"]
    return ["generic_legality"]
