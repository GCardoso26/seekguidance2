"""Ordenação formal de camadas contínuas (MTG — simplificado)."""

from __future__ import annotations

from app.reasoning.semantic_objects.continuous_effects import ContinuousEffect


def layer_sort_key(ce: ContinuousEffect, timestamp: int) -> tuple[int, int, str]:
    layer_rank = {
        "copiable_values": 1,
        "control_effects": 2,
        "text_modifiers": 3,
        "type_changing": 4,
        "color_changing": 5,
        "ability_add_remove": 6,
        "power_toughness": 7,
        "counter_layers": 8,
    }.get(ce.layer_subcategory, 99)
    return (layer_rank, timestamp, ce.effect_id)


def order_continuous_effects(items: list[tuple[ContinuousEffect, int]]) -> list[tuple[ContinuousEffect, int]]:
    return sorted(items, key=lambda x: layer_sort_key(x[0], x[1]))
