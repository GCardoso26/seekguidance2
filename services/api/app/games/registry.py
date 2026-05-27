"""Slugs canónicos (alinhados ao seed Postgres) e aliases de API."""

from __future__ import annotations

from typing import Final

from app.games.types import GameSemanticPack

# Aliases frequentes na API / integrações → slug persistido em `games.slug`
SLUG_ALIASES: Final[dict[str, str]] = {
    "one_piece": "onepiece",
    "one-piece": "onepiece",
    "op tcg": "onepiece",
    "ygo": "yugioh",
    "fab": "fab",
    "flesh_and_blood": "fab",
    "flesh-and-blood": "fab",
    "digimon tcg": "digimon",
    "lorcana tcg": "lorcana",
    "rift": "riftbound",
    "dragon_ball": "dbfw",
    "dragon_ball_super_fusion_world": "dbfw",
    "dbfw": "dbfw",
    "gundam": "gundam",
    "gundam_card_game": "gundam",
    "sorcery": "sorcery",
    "sorcery_contested_realm": "sorcery",
    "vanguard": "vanguard",
    "cardfight_vanguard": "vanguard",
    "union_arena": "union_arena",
}

# Jogos do sprint multi-TCG (subset; o seed completo pode incluir mais linhas)
SPRINT_MULTI_TCG_SLUGS: Final[tuple[str, ...]] = (
    "mtg",
    "pokemon",
    "yugioh",
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
)


def normalize_game_slug(raw: str) -> str:
    s0 = raw.strip().lower()
    s1 = s0.replace(" ", "_")
    return SLUG_ALIASES.get(s0) or SLUG_ALIASES.get(s1, s1)


def get_game_pack(game_slug: str) -> GameSemanticPack:
    """Perfil semântico para routing V2; MTG completo, restantes stub extensível."""
    slug = normalize_game_slug(game_slug)
    if slug == "mtg":
        from app.games.mtg.pack import pack

        return pack()
    return GameSemanticPack(
        slug=slug,
        display_name=slug.replace("_", " ").title(),
        graph_expansion_bias=1.0,
        ontology_version=f"{slug}-abstract-0.1",
    )
