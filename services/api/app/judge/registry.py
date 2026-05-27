"""Mapeamento TCG público (UI) ↔ games.slug (Postgres / RAG)."""

from __future__ import annotations

import re

# tcg id (frontend) → game slug (DB)
TCG_GAME_SLUG: dict[str, str] = {
    "magic": "mtg",
    "mtg": "mtg",
    "pokemon": "pokemon",
    "lorcana": "lorcana",
    "yugioh": "yugioh",
    "onepiece": "onepiece",
    "one_piece": "onepiece",
    "flesh_and_blood": "fab",
    "fab": "fab",
    "gundam": "gundam",
    "digimon": "digimon",
    "dragon_ball": "dbfw",
    "dragon_ball_super_fusion_world": "dbfw",
    "dbfw": "dbfw",
    "sorcery": "sorcery",
    "sorcery_contested_realm": "sorcery",
    "vanguard": "vanguard",
    "cardfight_vanguard": "vanguard",
    "riftbound": "riftbound",
    "union_arena": "union_arena",
}

# game slug (DB) → tcg id canónico (frontend)
CANONICAL_TCG_BY_GAME_SLUG: dict[str, str] = {
    "mtg": "magic",
    "pokemon": "pokemon",
    "lorcana": "lorcana",
    "yugioh": "yugioh",
    "onepiece": "one_piece",
    "fab": "flesh_and_blood",
    "gundam": "gundam",
    "digimon": "digimon",
    "dbfw": "dragon_ball",
    "sorcery": "sorcery",
    "vanguard": "vanguard",
    "riftbound": "riftbound",
    "union_arena": "union_arena",
}

TCG_COMING_SOON: frozenset[str] = frozenset(
    {
        "swu",
        "star_wars_unlimited",
    }
)


def normalize_tcg(raw: str) -> str:
    return re.sub(r"[^a-z0-9_]", "", raw.lower().strip().replace("-", "_"))


def game_slug_for_tcg(tcg: str) -> str | None:
    return TCG_GAME_SLUG.get(normalize_tcg(tcg))


def tcg_id_for_game_slug(game_slug: str) -> str:
    return CANONICAL_TCG_BY_GAME_SLUG.get(game_slug, game_slug)
