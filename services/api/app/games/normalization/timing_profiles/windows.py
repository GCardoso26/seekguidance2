"""Janelas de timing por TCG (rótulos, não simulador completo)."""

from __future__ import annotations


def timing_labels(game_slug: str) -> list[str]:
    g = game_slug.lower()
    if g == "mtg":
        return ["priority", "stack", "cleanup_step", "sba"]
    if g == "yugioh":
        return ["segoc", "chain_build", "chain_resolve", "missing_timing"]
    if g == "pokemon":
        return ["between_turns", "attack_step", "priority_simple"]
    if g == "onepiece":
        return ["main", "counter", "don_activate"]
    if g == "digimon":
        return ["main", "reaction", "memory_threshold"]
    if g == "fab":
        return ["attack_step", "combat_chain", "layer_float"]
    if g == "lorcana":
        return ["ink", "quest", "challenging"]
    if g == "riftbound":
        return ["action_window", "response_window"]
    return ["unspecified"]
