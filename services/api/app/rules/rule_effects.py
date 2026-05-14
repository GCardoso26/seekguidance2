"""Efeitos simbólicos inferidos por tipo de regra."""

from __future__ import annotations

from app.rules.structured_rules import RuleType


def infer_state_effects(rule_type: RuleType) -> list[str]:
    if rule_type == "replacement_effect":
        return ["modify_pending_event", "may_change_damage_life_zone_outcomes"]
    if rule_type == "state_based_action":
        return ["perform_game_actions", "may_cause_cascading_sba"]
    if rule_type == "trigger_resolution":
        return ["schedule_triggered_objects", "may_insert_stack_objects"]
    if rule_type == "layer_continuous":
        return ["recompute_continuous_layer_order"]
    if rule_type == "priority_timing":
        return ["open_or_close_priority_window"]
    if rule_type in ("stack_interaction", "chain_interaction"):
        return ["resolve_ordered_objects"]
    return ["noop_symbolic"]


def infer_zone_effects(rule_type: RuleType) -> list[str]:
    if rule_type == "trigger_resolution":
        return ["STACK", "BATTLEFIELD", "GRAVEYARD"]
    if rule_type == "state_based_action":
        return ["BATTLEFIELD", "GRAVEYARD", "HAND", "EXILE"]
    if rule_type == "replacement_effect":
        return ["ANY_ZONE_TARGETED_BY_EVENT"]
    return ["ABSTRACT"]
