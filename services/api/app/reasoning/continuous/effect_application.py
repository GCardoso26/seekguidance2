"""Aplicação determinística de ordenação de efeitos em objeto."""

from __future__ import annotations

from typing import Any

from app.reasoning.continuous.layer_engine import order_continuous_effects
from app.reasoning.semantic_objects.continuous_effects import ContinuousEffect


def apply_ordered_continuous(
    bindings: list[tuple[ContinuousEffect, int]],
) -> dict[str, Any]:
    ordered = order_continuous_effects(bindings)
    return {
        "application_order": [ce.effect_id for ce, _ in ordered],
        "layer_ordered_pairs": [(ce.layer_subcategory, ts) for ce, ts in ordered],
    }
