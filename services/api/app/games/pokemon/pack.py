from __future__ import annotations

from app.games.types import GameSemanticPack


def pack() -> GameSemanticPack:
    return GameSemanticPack(
        slug="pokemon",
        display_name="Pokémon TCG",
        graph_expansion_bias=0.95,
        ontology_version="pokemon-abstract-0.1",
    )
