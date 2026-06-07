"""Adaptador Pokémon TCG."""

from __future__ import annotations

from app.tcg_adapters.base import GameAdapter
from app.tcg_adapters.parsers import parse_ptcgo
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
    count_by_name,
    count_cards,
    validate_banlist,
    validate_copies,
    validate_size,
)

_BASIC_ENERGY = frozenset(
    {
        "grass energy",
        "fire energy",
        "water energy",
        "lightning energy",
        "psychic energy",
        "fighting energy",
        "darkness energy",
        "metal energy",
        "fairy energy",
        "double colorless energy",
    }
)

_POKEMON_BANLIST: dict[str, dict[str, str]] = {
    "STANDARD": {},
    "EXPANDED": {},
}


class PokemonAdapter(GameAdapter):
    code = "POKEMON"  # type: ignore[assignment]
    name = "Pokémon TCG"

    _SEED_CARDS = [
        UnifiedCard(
            id="pikachu-ss",
            game="POKEMON",
            external_id="pikachu-ss",
            name="Pikachu",
            normalized_name="pikachu",
            set_code="SSH",
            card_type="Pokémon",
            game_specific_type="basic",
            legality={"STANDARD": "legal", "EXPANDED": "legal"},
            game_data={"hp": 60, "type": "Lightning", "stage": "Basic"},
        ),
        UnifiedCard(
            id="basic-lightning-energy",
            game="POKEMON",
            external_id="basic-lightning-energy",
            name="Lightning Energy",
            normalized_name="lightning energy",
            set_code="SVE",
            card_type="Energy",
            game_specific_type="basic_energy",
            legality={"STANDARD": "legal", "EXPANDED": "legal"},
            game_data={"type": "Lightning"},
        ),
    ]

    def supported_formats(self) -> list[TournamentFormatConfig]:
        return [
            TournamentFormatConfig(
                "STANDARD", "Standard", "Rotation oficial TPCi",
                True, True, 50, "BO3", "auto", 8, 4, 512,
            ),
            TournamentFormatConfig(
                "EXPANDED", "Expanded", "Formato Expanded",
                True, True, 50, "BO3", "auto", 8, 4, 512,
            ),
            TournamentFormatConfig(
                "LIMITED", "Limited", "Prerelease / Sealed",
                False, False, 50, "BO3", "auto", 8, 4, 512,
            ),
        ]

    def parse_decklist(self, raw: str, fmt: str) -> ParsedDecklist:
        return parse_ptcgo(raw, fmt)

    def validate_decklist(self, deck: ParsedDecklist) -> ValidationResult:
        fmt = deck.format.upper()
        errors: list[ValidationIssue] = []
        if fmt == "LIMITED":
            return build_result(deck, errors)

        errors.extend(validate_size(deck, min_size=60, max_size=60, exact=True))
        errors.extend(
            validate_copies(deck, max_copies=4, unlimited_names=_BASIC_ENERGY, use_normalized=True)
        )
        errors.extend(validate_banlist(deck, _POKEMON_BANLIST.get(fmt, {}), fmt))

        has_basic_pokemon = any(
            (c.card_type or "").lower() in ("pokemon", "pokémon")
            for c in deck.main_deck
        )
        if not has_basic_pokemon and count_cards(deck.main_deck) >= 60:
            pokemon_cards = [c for c in deck.main_deck if (c.card_type or "").lower() in ("pokemon", "pokémon")]
            if not pokemon_cards:
                errors.append(
                    ValidationIssue(
                        code="BASIC_POKEMON_REQUIRED",
                        message="O deck deve incluir pelo menos 1 Pokémon Básico",
                    )
                )

        return build_result(deck, errors)

    def get_max_copies(self, fmt: str) -> int:
        return 4

    def get_min_deck_size(self, fmt: str) -> int:
        return 60

    def get_max_deck_size(self, fmt: str) -> int | None:
        return 60

    def get_banlist(self, fmt: str) -> dict[str, str]:
        return _POKEMON_BANLIST.get(fmt.upper(), {})

    def search_cards(self, query: str, limit: int = 20) -> list[UnifiedCard]:
        q = normalize_card_name(query)
        return [c for c in self._SEED_CARDS if q in c.normalized_name][:limit]
