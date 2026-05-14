"""Registo mínimo de mapeamentos ontológicos por jogo (extensível)."""

from __future__ import annotations

from typing import Any

ONTOLOGY_MAP: dict[str, dict[str, Any]] = {
    "mtg": {"root": "GameObject", "zones": ["battlefield", "stack", "graveyard", "exile", "library", "hand"]},
    "yugioh": {"root": "Card", "zones": ["field", "deck", "gy", "banished", "hand", "chain"]},
    "pokemon": {"root": "Card", "zones": ["bench", "active", "deck", "discard", "prizes", "hand"]},
    "fab": {"root": "Card", "zones": ["arsenal", "pitch", "deck", "banished", "combat_chain"]},
    "onepiece": {"root": "Card", "zones": ["field", "life", "deck", "trash", "hand", "don"]},
    "digimon": {"root": "DigimonCard", "zones": ["battle_area", "raise_area", "deck", "trash", "security", "hand"]},
    "lorcana": {"root": "Card", "zones": ["inkwell", "in_play", "deck", "discard", "hand"]},
    "riftbound": {"root": "Entity", "zones": ["board", "deck", "discard", "hand"]},
}


def ontology_for_game(game_slug: str) -> dict[str, Any]:
    return dict(ONTOLOGY_MAP.get(game_slug.strip().lower(), {"root": "Unknown", "zones": []}))
