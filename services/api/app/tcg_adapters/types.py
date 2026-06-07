"""Tipos partilhados pelos adaptadores de TCG."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Literal

GameCode = Literal["POKEMON", "LORCANA", "MTG", "SWU"]
LegalityStatus = Literal["legal", "banned", "restricted", "not_legal"]

TOURNAMENT_GAME_CODES: tuple[GameCode, ...] = ("POKEMON", "LORCANA", "MTG", "SWU")

GAME_CODE_TO_SLUG: dict[str, str] = {
    "POKEMON": "pokemon",
    "LORCANA": "lorcana",
    "MTG": "mtg",
    "SWU": "swu",
}

SLUG_TO_GAME_CODE: dict[str, GameCode] = {
    "pokemon": "POKEMON",
    "lorcana": "LORCANA",
    "mtg": "MTG",
    "swu": "SWU",
}


@dataclass
class DeckCard:
    definition_id: str
    name: str
    quantity: int
    set_code: str | None = None
    collector_number: str | None = None
    card_type: str | None = None


@dataclass
class ParsedDecklist:
    tcg: str
    format: str
    main_deck: list[DeckCard]
    sideboard: list[DeckCard] = field(default_factory=list)
    commander: DeckCard | None = None


@dataclass
class ValidationIssue:
    code: str
    message: str
    severity: Literal["error", "warning"] = "error"
    cards_involved: list[str] = field(default_factory=list)
    rule_reference: str | None = None


@dataclass
class ValidationResult:
    valid: bool
    errors: list[ValidationIssue]
    warnings: list[ValidationIssue]
    format_rules_applied: str
    banlist_version: str


@dataclass
class TournamentFormatConfig:
    code: str
    name: str
    description: str
    decklist_required: bool
    decklist_validation: bool
    default_timer_minutes: int
    default_match_type: str
    default_swiss_rounds: str
    default_top_cut: int | None
    min_players: int
    max_players: int


@dataclass
class UnifiedCard:
    id: str
    game: GameCode
    external_id: str
    name: str
    normalized_name: str
    set_code: str | None = None
    set_name: str | None = None
    number: str | None = None
    rarity: str | None = None
    card_type: str | None = None
    game_specific_type: str | None = None
    legality: dict[str, LegalityStatus] = field(default_factory=dict)
    image_url: str | None = None
    game_data: dict[str, Any] = field(default_factory=dict)


def normalize_card_name(name: str) -> str:
    import re

    return re.sub(r"\s+", " ", name.strip().lower())
