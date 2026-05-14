from __future__ import annotations

from app.games.types import GameSemanticPack


def pack() -> GameSemanticPack:
    return GameSemanticPack(
        slug="yugioh",
        display_name="Yu-Gi-Oh! TCG",
        graph_expansion_bias=0.96,
        ontology_version="yugioh-abstract-0.1",
    )
