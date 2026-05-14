"""Ponte de vocabulário cross-TCG (sem colapsar mecânicas distintas)."""

from __future__ import annotations

from typing import Final

CANONICAL_TO_SUBSYSTEM: Final[dict[str, tuple[str, ...]]] = {
    "ordered_resolution": ("mtg:stack", "yugioh:chain", "fab:combat_chain"),
    "state_cleanup": ("mtg:sba", "digimon:memory_threshold"),
    "resource_clock": ("onepiece:don", "lorcana:ink"),
}


def describe_cross_tcg_bridge(concept: str) -> dict[str, str]:
    refs = CANONICAL_TO_SUBSYSTEM.get(concept, ())
    return {"concept": concept, "references": " | ".join(refs) if refs else "none"}
