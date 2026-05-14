from __future__ import annotations

from app.games.types import GameSemanticPack


def pack() -> GameSemanticPack:
    return GameSemanticPack(
        slug="lorcana",
        display_name="Disney Lorcana TCG",
        graph_expansion_bias=0.93,
        ontology_version="lorcana-abstract-0.1",
    )
