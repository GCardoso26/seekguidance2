"""Schema semântico abstracto cross-TCG."""

from __future__ import annotations

from typing import Literal

GameSemanticProfile = Literal["stack_based", "chain_based", "priority_pass", "unknown"]

UniversalSemanticCapability = Literal[
    "STACK_LIKE_SYSTEM",
    "CHAIN_SYSTEM",
    "REPLACEMENT_SYSTEM",
    "STATE_CHECK_SYSTEM",
    "TIMING_PRIORITY_SYSTEM",
    "TRIGGER_SYSTEM",
    "LAYER_SYSTEM",
    "ZONE_TRANSITION_SYSTEM",
]


def semantic_adapter_capabilities(game_slug: str) -> list[UniversalSemanticCapability]:
    g = (game_slug or "").lower()
    if g == "mtg":
        return [
            "STACK_LIKE_SYSTEM",
            "REPLACEMENT_SYSTEM",
            "STATE_CHECK_SYSTEM",
            "TIMING_PRIORITY_SYSTEM",
            "TRIGGER_SYSTEM",
            "LAYER_SYSTEM",
            "ZONE_TRANSITION_SYSTEM",
        ]
    if g in {"ygo", "yugioh"}:
        return [
            "CHAIN_SYSTEM",
            "TIMING_PRIORITY_SYSTEM",
            "TRIGGER_SYSTEM",
            "ZONE_TRANSITION_SYSTEM",
        ]
    if g == "pokemon":
        return ["STATE_CHECK_SYSTEM", "TIMING_PRIORITY_SYSTEM", "ZONE_TRANSITION_SYSTEM"]
    return ["TIMING_PRIORITY_SYSTEM"]
