from __future__ import annotations

import os
from typing import Any

import structlog
from app.infrastructure.external.providers.http_client import ResilientHttpClient
from app.infrastructure.external.providers.types import CatalogCard, CatalogSet, PriceQuote

logger = structlog.get_logger(__name__)

TCGCSV_CATEGORY_VANGUARD = 16
TCGCSV_BASE = "https://tcgcsv.com/tcgplayer"
TCGCSV_UA = "JudgeTCG/1.0 (catalog sync; contact@judgetcg.com.br)"
SEALED_KEYWORDS = ("booster box", "display", "starter deck", "trial deck", "deck set", "case")


class TcgCsvProvider:
    """Adapter para TCGCSV — espelho público de dados TCGPlayer (sem api.tcgplayer.com)."""

    provider_id = "tcgcsv"

    def __init__(self) -> None:
        self._http = ResilientHttpClient(timeout=120.0, user_agent=TCGCSV_UA)

    def _headers(self) -> dict[str, str]:
        h = {"Accept": "application/json", "User-Agent": TCGCSV_UA}
        key = os.getenv("JUSTTCG_API_KEY", "").strip()
        if key:
            h["x-api-key"] = key
        return h

    @staticmethod
    def _extended_map(product: dict[str, Any]) -> dict[str, str]:
        out: dict[str, str] = {}
        for row in product.get("extendedData") or []:
            if isinstance(row, dict):
                name = str(row.get("name") or row.get("displayName") or "").strip()
                value = str(row.get("value") or "").strip()
                if name and value:
                    out[name] = value
        return out

    @classmethod
    def _is_single_card(cls, product: dict[str, Any]) -> bool:
        ext = cls._extended_map(product)
        if "Number" not in ext:
            return False
        name = str(product.get("name") or "").lower()
        return not any(kw in name for kw in SEALED_KEYWORDS)

    @staticmethod
    def _card_number(ext: dict[str, str]) -> str:
        raw = ext.get("Number", "")
        if "/" in raw:
            return raw.split("/", 1)[1].replace("EN", "").strip()
        return raw

    @staticmethod
    def _set_code_from_number(ext: dict[str, str], fallback: str) -> str:
        raw = ext.get("Number", "")
        if "/" in raw:
            return raw.split("/", 1)[0].strip() or fallback
        return fallback

    async def list_sets(self, game_code: str) -> list[CatalogSet]:
        if game_code.upper() != "VANGUARD":
            return []

        res = await self._http.request(
            "GET",
            f"{TCGCSV_BASE}/{TCGCSV_CATEGORY_VANGUARD}/groups",
            headers=self._headers(),
        )
        if res is None or not res.is_success:
            return []

        rows = res.json().get("results") if isinstance(res.json(), dict) else []
        if not isinstance(rows, list):
            return []

        return [
            CatalogSet(
                code=str(row.get("abbreviation") or row.get("groupId") or ""),
                name=str(row.get("name") or row.get("abbreviation") or ""),
                external_id=str(row.get("groupId") or ""),
                release_date=row.get("publishedOn"),
            )
            for row in rows
            if isinstance(row, dict) and row.get("abbreviation")
        ]

    async def list_cards_in_set(
        self,
        game_code: str,
        set_ref: CatalogSet,
        *,
        limit: int | None = None,
    ) -> list[CatalogCard]:
        if game_code.upper() != "VANGUARD" or not set_ref.external_id:
            return []

        res = await self._http.request(
            "GET",
            f"{TCGCSV_BASE}/{TCGCSV_CATEGORY_VANGUARD}/{set_ref.external_id}/products",
            headers=self._headers(),
        )
        if res is None or not res.is_success:
            return []

        products = res.json().get("results") if isinstance(res.json(), dict) else []
        if not isinstance(products, list):
            return []

        cards: list[CatalogCard] = []
        for product in products:
            if limit is not None and len(cards) >= limit:
                break
            if not isinstance(product, dict) or not self._is_single_card(product):
                continue

            ext = self._extended_map(product)
            name = str(product.get("cleanName") or product.get("name") or "Unknown")
            product_id = str(product.get("productId") or len(cards))
            image = product.get("imageUrl") or product.get("image_url")
            card_set_code = self._set_code_from_number(ext, set_ref.code)

            cards.append(
                CatalogCard(
                    external_id=product_id,
                    name=name,
                    set_code=card_set_code,
                    set_name=set_ref.name,
                    card_number=self._card_number(ext),
                    rarity=ext.get("Rarity"),
                    card_type=ext.get("Unit") or ext.get("Card Type"),
                    image_url=image,
                    source="tcgcsv",
                    external_ids={"tcgplayer": product_id},
                    game_data={
                        "clan": ext.get("Clan") or ext.get("Race"),
                        "nation": ext.get("Nation"),
                        "grade": ext.get("Grade"),
                        "trigger": ext.get("Trigger"),
                        "critical": ext.get("Critical"),
                        "power": ext.get("Power"),
                        "shield": ext.get("Shield"),
                        "text": ext.get("Description"),
                        "skill_icon": ext.get("Skill Icon"),
                        "number": ext.get("Number"),
                    },
                ),
            )

        return cards

    async def search_price(self, card_name: str, *, game: str, set_code: str | None = None) -> PriceQuote | None:
        return None

    async def bulk_prices(self, card_names: list[str], *, game: str) -> list[PriceQuote]:
        return []
