"""Adaptador Magic: The Gathering."""

from __future__ import annotations

from app.tcg_adapters.base import GameAdapter
from app.tcg_adapters.parsers import parse_mtg_dec
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

_BASIC_LANDS = frozenset(
    {
        "plains",
        "island",
        "swamp",
        "mountain",
        "forest",
        "wastes",
        "snow-covered plains",
        "snow-covered island",
        "snow-covered swamp",
        "snow-covered mountain",
        "snow-covered forest",
    }
)

_MTG_BANLIST: dict[str, dict[str, str]] = {
    "STANDARD": {},
    "PIONEER": {},
    "MODERN": {},
    "COMMANDER": {},
}


class MtgAdapter(GameAdapter):
    code = "MTG"  # type: ignore[assignment]
    name = "Magic: The Gathering"

    _SEED_CARDS = [
        UnifiedCard(
            id="lightning-bolt",
            game="MTG",
            external_id="lightning-bolt",
            name="Lightning Bolt",
            normalized_name="lightning bolt",
            set_code="LEA",
            card_type="Instant",
            legality={"STANDARD": "not_legal", "MODERN": "legal", "PIONEER": "legal"},
            game_data={"mana_cost": "{R}", "cmc": 1, "colors": ["R"]},
        ),
        UnifiedCard(
            id="counterspell",
            game="MTG",
            external_id="counterspell",
            name="Counterspell",
            normalized_name="counterspell",
            set_code="LEA",
            card_type="Instant",
            legality={"STANDARD": "not_legal", "MODERN": "legal", "PIONEER": "legal"},
            game_data={"mana_cost": "{U}{U}", "cmc": 2, "colors": ["U"]},
        ),
    ]

    def supported_formats(self) -> list[TournamentFormatConfig]:
        return [
            TournamentFormatConfig(
                "STANDARD", "Standard", "Formato Standard DCI",
                True, True, 50, "BO3", "auto", 8, 4, 512,
            ),
            TournamentFormatConfig(
                "PIONEER", "Pioneer", "Sets de Ravnica em diante",
                True, True, 50, "BO3", "auto", 8, 4, 512,
            ),
            TournamentFormatConfig("MODERN", "Modern", "Formato Modern", True, True, 50, "BO3", "auto", 8, 4, 512),
            TournamentFormatConfig("DRAFT", "Draft", "3 rodadas + Top 4", False, False, 50, "BO3", "3", 4, 4, 32),
            TournamentFormatConfig("SEALED", "Sealed", "Sealed Deck", False, False, 50, "BO3", "auto", 8, 4, 512),
            TournamentFormatConfig("COMMANDER", "Commander", "EDH pods", True, True, 90, "FFA", "auto", None, 4, 32),
        ]

    def parse_decklist(self, raw: str, fmt: str) -> ParsedDecklist:
        return parse_mtg_dec(raw, fmt)

    def validate_decklist(self, deck: ParsedDecklist) -> ValidationResult:
        fmt = deck.format.upper()
        errors: list[ValidationIssue] = []

        if fmt in ("DRAFT", "SEALED"):
            errors.extend(validate_size(deck, min_size=40, max_size=None))
            return build_result(deck, errors)

        if fmt == "COMMANDER":
            errors.extend(validate_size(deck, min_size=100, max_size=100, exact=True))
            errors.extend(validate_copies(deck, max_copies=1, use_normalized=True))
            if not deck.commander:
                errors.append(
                    ValidationIssue(code="COMMANDER_REQUIRED", message="Commander EDH obrigatório (linha Commander:)")
                )
            return build_result(deck, errors)

        errors.extend(validate_size(deck, min_size=60, max_size=None))
        errors.extend(
            validate_copies(deck, max_copies=4, unlimited_names=_BASIC_LANDS, use_normalized=True)
        )
        errors.extend(validate_banlist(deck, _MTG_BANLIST.get(fmt, {}), fmt))

        if deck.sideboard:
            sb_total = count_cards(deck.sideboard)
            if sb_total > 15:
                errors.append(
                    ValidationIssue(
                        code="SIDEBOARD_TOO_LARGE",
                        message=f"Sideboard tem {sb_total} cartas. Máximo: 15",
                    )
                )

        return build_result(deck, errors)

    def get_max_copies(self, fmt: str) -> int:
        return 1 if fmt.upper() == "COMMANDER" else 4

    def get_min_deck_size(self, fmt: str) -> int:
        f = fmt.upper()
        if f == "COMMANDER":
            return 100
        if f in ("DRAFT", "SEALED"):
            return 40
        return 60

    def get_max_deck_size(self, fmt: str) -> int | None:
        return 100 if fmt.upper() == "COMMANDER" else None

    def get_sideboard_rules(self, fmt: str) -> dict | None:
        if fmt.upper() == "COMMANDER":
            return None
        if fmt.upper() in ("DRAFT", "SEALED"):
            return None
        return {"maxSize": 15, "swapRule": "1:1"}

    def get_banlist(self, fmt: str) -> dict[str, str]:
        return _MTG_BANLIST.get(fmt.upper(), {})

    def search_cards(self, query: str, limit: int = 20) -> list[UnifiedCard]:
        q = normalize_card_name(query)
        return [c for c in self._SEED_CARDS if q in c.normalized_name][:limit]
