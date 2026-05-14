"""Fontes oficiais por jogo e tipo de documento (matriz de ingestão)."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class SourceSpec:
    game_slug: str
    doc_type: str
    title: str
    url: str
    notes: str = ""


_POK_RULES = "https://www.pokemon.com/us/pokemon-tcg/rules/"


# URLs públicas conhecidas — validar periodicamente antes de crawls em produção.
OFFICIAL_SOURCES: tuple[SourceSpec, ...] = (
    SourceSpec("mtg", "CR", "Magic Comprehensive Rules", "https://magic.wizards.com/en/rules", "Hub → PDFs"),
    SourceSpec("mtg", "MTR", "Magic Tournament Rules", "https://magic.wizards.com/en/rules", "via hub"),
    SourceSpec("mtg", "IPG", "Infraction Procedure Guide", "https://magic.wizards.com/en/rules", "via hub"),
    SourceSpec("pokemon", "TournamentRules", "Tournament Rules Handbook", _POK_RULES, ""),
    SourceSpec("pokemon", "Penalties", "Penalty Guidelines", _POK_RULES, "subpágina"),
    SourceSpec("yugioh", "Rulebook", "Official Rulebook", "https://www.yugioh-card.com/en/rulebook/", ""),
    SourceSpec(
        "yugioh",
        "Policy",
        "KDE Tournament Policy",
        "https://www.yugioh-card.com/en/events/",
        "ajustar path KDE",
    ),
    SourceSpec("onepiece", "CR", "One Piece Card Game Rules", "https://en.onepiece-cardgame.com/rules/", ""),
    SourceSpec(
        "digimon",
        "RuleManual",
        "Digimon Card Game Rule Manual",
        "https://world.digimoncard.com/rule/",
        "",
    ),
    SourceSpec(
        "fab",
        "CR",
        "Flesh and Blood Comprehensive Rules",
        "https://fabtcg.com/resources/rules-and-policy/",
        "",
    ),
    SourceSpec("lorcana", "CR", "Disney Lorcana Rules", "https://www.disneylorcana.com/en-US/rules", ""),
    SourceSpec(
        "riftbound",
        "CR",
        "Riftbound Rules",
        "https://riftbound.leagueoflegends.com/en-us/",
        "URL a confirmar",
    ),
)


def sources_for_game(game_slug: str) -> list[SourceSpec]:
    g = game_slug.strip().lower()
    return [s for s in OFFICIAL_SOURCES if s.game_slug == g]
