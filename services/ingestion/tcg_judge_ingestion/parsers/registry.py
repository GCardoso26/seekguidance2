"""Router de extração por `game_slug`."""

from __future__ import annotations

from collections.abc import Callable
from typing import Any

from tcg_judge_ingestion.parsers._stub_extract import empty_extract
from tcg_judge_ingestion.parsers.digimon.extract import extract_digimon_signals
from tcg_judge_ingestion.parsers.fab.extract import extract_fab_signals
from tcg_judge_ingestion.parsers.lorcana.extract import extract_lorcana_signals
from tcg_judge_ingestion.parsers.mtg.extract import extract_mtg_signals
from tcg_judge_ingestion.parsers.onepiece.extract import extract_onepiece_signals
from tcg_judge_ingestion.parsers.pokemon.extract import extract_pokemon_signals
from tcg_judge_ingestion.parsers.riftbound.extract import extract_riftbound_signals
from tcg_judge_ingestion.parsers.yugioh.extract import extract_yugioh_signals
from tcg_judge_ingestion.parsers.deep_semantics import enrich_parser_signals

_REGISTRY: dict[str, Callable[[str], dict[str, Any]]] = {
    "mtg": extract_mtg_signals,
    "yugioh": extract_yugioh_signals,
    "pokemon": extract_pokemon_signals,
    "onepiece": extract_onepiece_signals,
    "digimon": extract_digimon_signals,
    "fab": extract_fab_signals,
    "lorcana": extract_lorcana_signals,
    "riftbound": extract_riftbound_signals,
}


def extract_for_game(game_slug: str, text: str) -> dict[str, Any]:
    slug = game_slug.strip().lower()
    fn = _REGISTRY.get(slug)
    if fn is None:
        base = empty_extract(text)
    else:
        base = fn(text)
    return enrich_parser_signals(slug, text, base)
