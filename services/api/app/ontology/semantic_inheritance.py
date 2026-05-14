"""Herança semântica formal."""

from __future__ import annotations


def inheritance_map() -> dict[str, list[str]]:
    return {
        "replacement_effect": ["state_modification", "event_rewriter"],
        "triggered_ability": ["stack_object"],
        "continuous_effect": ["layer_bound_effect"],
    }
