"""Builder de efeitos semânticos runtime-ready."""

from __future__ import annotations


def build_semantic_effects(tokens: list[str]) -> list[dict[str, str]]:
    effects: list[dict[str, str]] = []
    if "instead" in tokens:
        effects.append({"effect": "replacement_effect", "scope": "event"})
    if "draw" in tokens:
        effects.append({"effect": "card_draw", "scope": "player"})
    if "destroy" in tokens:
        effects.append({"effect": "destroy_permanent", "scope": "battlefield"})
    return effects
