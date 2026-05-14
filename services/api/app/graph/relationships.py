"""Tipos de relação entre regras (gameplay / timing / mecânicas)."""

from __future__ import annotations

from enum import Enum


class RuleRelation(str, Enum):
    references = "references"
    interacts_with = "interacts_with"
    modifies = "modifies"
    depends_on = "depends_on"
    overrides = "overrides"
    timing_related = "timing_related"
    replacement_interaction = "replacement_interaction"
    stack_interaction = "stack_interaction"
    state_based_dependency = "state_based_dependency"
    gameplay_dependency = "gameplay_dependency"
    semantic_related = "semantic_related"
    dependency_related = "dependency_related"
    gameplay_related = "gameplay_related"
    combat_interaction = "combat_interaction"
