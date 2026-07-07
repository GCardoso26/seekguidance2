from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass(slots=True)
class CatalogSet:
    code: str
    name: str
    external_id: str
    release_date: str | None = None
    card_count: int | None = None


@dataclass(slots=True)
class CatalogCard:
    external_id: str
    name: str
    set_code: str
    set_name: str
    card_number: str | None = None
    rarity: str | None = None
    card_type: str | None = None
    image_url: str | None = None
    source: str = "tcgapi"
    external_ids: dict[str, str] = field(default_factory=dict)
    game_data: dict[str, Any] = field(default_factory=dict)
    price_usd: float | None = None


@dataclass(slots=True)
class PriceQuote:
    card_name: str
    market_price_usd: float | None
    price_change_7d: str | float | None = None
    set_name: str | None = None
    raw: dict[str, Any] = field(default_factory=dict)
