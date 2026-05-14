from __future__ import annotations

from app.games.types import GameSemanticPack


def pack() -> GameSemanticPack:
    return GameSemanticPack(
        slug="onepiece",
        display_name="One Piece TCG",
        graph_expansion_bias=0.94,
        ontology_version="onepiece-abstract-0.1",
    )
