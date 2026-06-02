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
    "swu": "swu",
    "star_wars_unlimited": "swu",
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
    "swu": "star_wars_unlimited",
}

TCG_COMING_SOON: frozenset[str] = frozenset()

TCG_BETA: frozenset[str] = frozenset(
    {
        "swu",
        "star_wars_unlimited",
    }
)

# Língua predominante do corpus indexado (HyDE activo quando corpus=en)
GAME_CORPUS_LANGUAGE: dict[str, str] = {
    "mtg": "en",
    "pokemon": "en",
    "lorcana": "en",
    "yugioh": "en",
    "onepiece": "en",
    "fab": "en",
    "digimon": "en",
    "gundam": "en",
    "dbfw": "en",
    "sorcery": "en",
    "vanguard": "en",
    "riftbound": "en",
    "union_arena": "en",
    "swu": "en",
}


def corpus_language_for_game_slug(game_slug: str) -> str:
    return GAME_CORPUS_LANGUAGE.get(game_slug.strip().lower(), "en")


def display_name_for_game_slug(game_slug: str) -> str:
    labels = {
        "mtg": "Magic: The Gathering",
        "pokemon": "Pokémon TCG",
        "lorcana": "Disney Lorcana",
        "yugioh": "Yu-Gi-Oh!",
        "onepiece": "One Piece Card Game",
        "fab": "Flesh and Blood",
        "digimon": "Digimon Card Game",
        "gundam": "Gundam Card Game",
        "dbfw": "Dragon Ball Fusion World",
        "sorcery": "Sorcery: Contested Realm",
        "vanguard": "Cardfight!! Vanguard",
        "riftbound": "Riftbound",
        "union_arena": "Union Arena",
        "swu": "Star Wars: Unlimited",
    }
    return labels.get(game_slug.strip().lower(), game_slug.replace("_", " ").title())


def normalize_tcg(raw: str) -> str:
    return re.sub(r"[^a-z0-9_]", "", raw.lower().strip().replace("-", "_"))


def game_slug_for_tcg(tcg: str) -> str | None:
    return TCG_GAME_SLUG.get(normalize_tcg(tcg))


def tcg_id_for_game_slug(game_slug: str) -> str:
    return CANONICAL_TCG_BY_GAME_SLUG.get(game_slug, game_slug)
