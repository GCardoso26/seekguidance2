from __future__ import annotations

from app.games.mtg.graph_bias import DEFAULT_GRAPH_BIAS
from app.games.types import GameSemanticPack


def pack() -> GameSemanticPack:
    return GameSemanticPack(
        slug="mtg",
        display_name="Magic: The Gathering",
        graph_expansion_bias=DEFAULT_GRAPH_BIAS,
        ontology_version="mtg-cr-abstract-0.1",
    )
