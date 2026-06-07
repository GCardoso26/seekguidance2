"""Adaptador Star Wars Unlimited (referência existente)."""

from __future__ import annotations

from app.tcg_adapters.base import GameAdapter
from app.tcg_adapters.parsers import parse_generic_lines
from app.tcg_adapters.types import (
    ParsedDecklist,
    TournamentFormatConfig,
    UnifiedCard,
    ValidationResult,
    normalize_card_name,
)
from app.tcg_adapters.validation import (
    build_result,
    validate_copies,
    validate_size,
)


class SwuAdapter(GameAdapter):
    code = "SWU"  # type: ignore[assignment]
    name = "Star Wars Unlimited"

    _SEED_CARDS = [
        UnifiedCard(
            id="luke-skywalker",
            game="SWU",
            external_id="luke-skywalker",
            name="Luke Skywalker",
            normalized_name="luke skywalker",
            set_code="SOR",
            card_type="Unit",
            game_specific_type="leader",
            legality={"STANDARD": "legal"},
            game_data={"aspect": "Heroism", "cost": 5},
        ),
    ]

    def supported_formats(self) -> list[TournamentFormatConfig]:
        return [
            TournamentFormatConfig(
                "STANDARD", "Standard", "Constructed SWU",
                True, True, 55, "BO3", "auto", 8, 4, 512,
            ),
            TournamentFormatConfig(
                "LIMITED", "Limited", "Draft / Sealed SWU",
                False, False, 55, "BO3", "auto", 8, 4, 512,
            ),
        ]

    def parse_decklist(self, raw: str, fmt: str) -> ParsedDecklist:
        return parse_generic_lines(raw, "swu", fmt)

    def validate_decklist(self, deck: ParsedDecklist) -> ValidationResult:
        fmt = deck.format.upper()
        errors = []
        if fmt == "LIMITED":
            return build_result(deck, errors)

        errors.extend(validate_size(deck, min_size=50, max_size=50, exact=True))
        errors.extend(validate_copies(deck, max_copies=3, use_normalized=True))
        return build_result(deck, errors)

    def get_max_copies(self, fmt: str) -> int:
        return 3

    def get_min_deck_size(self, fmt: str) -> int:
        return 50

    def get_max_deck_size(self, fmt: str) -> int | None:
        return 50

    def search_cards(self, query: str, limit: int = 20) -> list[UnifiedCard]:
        q = normalize_card_name(query)
        return [c for c in self._SEED_CARDS if q in c.normalized_name][:limit]
