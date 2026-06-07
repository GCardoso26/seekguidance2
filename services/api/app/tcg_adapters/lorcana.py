"""Adaptador Disney Lorcana."""

from __future__ import annotations

from app.tcg_adapters.base import GameAdapter
from app.tcg_adapters.parsers import parse_lorcana
from app.tcg_adapters.types import (
    ParsedDecklist,
    TournamentFormatConfig,
    UnifiedCard,
    ValidationIssue,
    ValidationResult,
    normalize_card_name,
)
from app.tcg_adapters.validation import (
    build_result,
    count_cards,
    validate_banlist,
    validate_copies,
    validate_size,
)

_LORCANA_BANLIST: dict[str, dict[str, str]] = {
    "CONSTRUCTED": {"lorcana-banned-001": "banned"},
}


class LorcanaAdapter(GameAdapter):
    code = "LORCANA"  # type: ignore[assignment]
    name = "Disney Lorcana"

    _SEED_CARDS = [
        UnifiedCard(
            id="elsa-snow-queen",
            game="LORCANA",
            external_id="elsa-snow-queen",
            name="Elsa - Snow Queen",
            normalized_name="elsa snow queen",
            set_code="TFC",
            card_type="Character",
            game_specific_type="character",
            legality={"CONSTRUCTED": "legal"},
            game_data={"ink_cost": 4, "inkable": True},
        ),
    ]

    def supported_formats(self) -> list[TournamentFormatConfig]:
        return [
            TournamentFormatConfig(
                "CONSTRUCTED", "Constructed", "60 cartas, chapter rotation",
                True, True, 55, "BO3", "auto", 8, 4, 512,
            ),
            TournamentFormatConfig(
                "LIMITED", "Limited", "Draft / Sealed",
                False, False, 55, "BO3", "auto", 8, 4, 512,
            ),
        ]

    def parse_decklist(self, raw: str, fmt: str) -> ParsedDecklist:
        return parse_lorcana(raw, fmt)

    def validate_decklist(self, deck: ParsedDecklist) -> ValidationResult:
        fmt = deck.format.upper()
        errors: list[ValidationIssue] = []
        if fmt == "LIMITED":
            return build_result(deck, errors)

        errors.extend(validate_size(deck, min_size=60, max_size=60, exact=True))
        errors.extend(validate_copies(deck, max_copies=4, use_normalized=True))
        errors.extend(validate_banlist(deck, _LORCANA_BANLIST.get(fmt, {}), fmt))

        characters = [
            c for c in deck.main_deck
            if (c.card_type or "").lower() == "character"
            or "character" in normalize_card_name(c.name)
        ]
        if count_cards(deck.main_deck) >= 60 and not characters:
            errors.append(
                ValidationIssue(
                    code="CHARACTER_REQUIRED",
                    message="O deck deve incluir pelo menos 1 Personagem",
                )
            )

        return build_result(deck, errors)

    def get_banlist(self, fmt: str) -> dict[str, str]:
        return _LORCANA_BANLIST.get(fmt.upper(), {})

    def search_cards(self, query: str, limit: int = 20) -> list[UnifiedCard]:
        q = normalize_card_name(query)
        return [c for c in self._SEED_CARDS if q in c.normalized_name][:limit]
