"""Canonical game slug ↔ code maps (shared by catalog services)."""

from __future__ import annotations

SLUG_TO_CODE: dict[str, str] = {
    "mtg": "MTG",
    "magic": "MTG",
    "pokemon": "POKEMON",
    "yugioh": "YGO",
    "ygo": "YGO",
    "lorcana": "LORCANA",
    "onepiece": "ONEPIECE",
    "fab": "FAB",
    "digimon": "DIGIMON",
    "swu": "SWU",
    "riftbound": "RIFTBOUND",
    "sorcery": "SORCERY",
    "gundam": "GUNDAM",
    "gundam-card-game": "GUNDAM",
    "unionarena": "UARENA",
    "union-arena": "UARENA",
    "dbfw": "DBFW",
    "db-fusion-world": "DBFW",
    "dragonball": "DBFW",
    "dragon_ball": "DBFW",
    "vanguard": "VANGUARD",
    "cardfight-vanguard": "VANGUARD",
}

CODE_TO_SLUG: dict[str, str] = {
    "MTG": "mtg",
    "POKEMON": "pokemon",
    "YGO": "yugioh",
    "LORCANA": "lorcana",
    "ONEPIECE": "onepiece",
    "FAB": "fab",
    "DIGIMON": "digimon",
    "SWU": "swu",
    "RIFTBOUND": "riftbound",
    "SORCERY": "sorcery",
    "GUNDAM": "gundam",
    "UARENA": "union-arena",
    "DBFW": "dbfw",
    "VANGUARD": "vanguard",
}


def resolve_game_code(game: str | None) -> str | None:
    """Accept slug (`yugioh`) or code (`YGO`) and return canonical game_code."""
    if not game:
        return None
    raw = game.strip()
    if not raw:
        return None
    upper = raw.upper()
    if upper in CODE_TO_SLUG:
        return upper
    normalized = raw.lower().replace("_", "-")
    if normalized in SLUG_TO_CODE:
        return SLUG_TO_CODE[normalized]
    collapsed = normalized.replace("-", "")
    for key, code in SLUG_TO_CODE.items():
        if key.replace("-", "") == collapsed:
            return code
    return upper
