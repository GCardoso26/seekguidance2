"""Registry de crawlers `crawlers_real`."""
from __future__ import annotations

GAME_SLUGS = [
    "mtg",
    "yugioh",
    "pokemon",
    "onepiece",
    "digimon",
    "fab",
    "lorcana",
    "riftbound",
    "gundam",
    "dbfw",
    "sorcery",
    "vanguard",
    "union_arena",
]


def list_game_slugs() -> list[str]:
    return list(GAME_SLUGS)
