"""Interface base para adaptadores de TCG."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any

from app.tcg_adapters.types import (
    GameCode,
    ParsedDecklist,
    TournamentFormatConfig,
    UnifiedCard,
    ValidationResult,
)


class GameAdapter(ABC):
    code: GameCode
    name: str

    @abstractmethod
    def supported_formats(self) -> list[TournamentFormatConfig]:
        ...

    @abstractmethod
    def parse_decklist(self, raw: str, fmt: str) -> ParsedDecklist:
        ...

    @abstractmethod
    def validate_decklist(self, deck: ParsedDecklist) -> ValidationResult:
        ...

    def get_max_copies(self, fmt: str) -> int:
        return 4

    def get_min_deck_size(self, fmt: str) -> int:
        return 60

    def get_max_deck_size(self, fmt: str) -> int | None:
        return 60

    def get_sideboard_rules(self, fmt: str) -> dict[str, Any] | None:
        return None

    def get_banlist(self, fmt: str) -> dict[str, str]:
        return {}

    def search_cards(self, query: str, limit: int = 20) -> list[UnifiedCard]:
        return []

    async def sync_card_database(self) -> dict[str, Any]:
        return {"status": "not_implemented", "game": self.code}
