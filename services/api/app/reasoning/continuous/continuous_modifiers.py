"""Modificadores contínuos simbólicos."""

from __future__ import annotations

from app.reasoning.semantic_objects.object_modifiers import compose_modifiers


def pt_modifier_strings(delta_power: int, delta_toughness: int) -> list[str]:
    if delta_power == 0 and delta_toughness == 0:
        return []
    return compose_modifiers([f"P{delta_power:+d}", f"T{delta_toughness:+d}"])
