from __future__ import annotations

import time
from typing import Any

import structlog
from app.core.config import get_settings
from app.infrastructure.external.providers.http_client import ResilientHttpClient
from app.infrastructure.external.providers.types import CatalogCard, CatalogSet, PriceQuote

logger = structlog.get_logger(__name__)

TCG_API_BASE_DEFAULT = "https://api.tcgapi.dev/v1"

# Slug tcgapi.dev por game_code interno
GAME_SLUGS: dict[str, str] = {
    "MTG": "magic-the-gathering",
    "POKEMON": "pokemon",
    "YGO": "yu-gi-oh",
    "LORCANA": "lorcana",
    "ONEPIECE": "one-piece-card-game",
    "FAB": "flesh-and-blood",
    "VANGUARD": "cardfight-vanguard",
    "DIGIMON": "digimon-card-game",
    "SWU": "star-wars-unlimited",
    "RIFTBOUND": "riftbound",
}


class _TtlCache:
    def __init__(self, ttl_seconds: float = 3600.0) -> None:
        self._ttl = ttl_seconds
        self._store: dict[str, tuple[float, Any]] = {}

    def get(self, key: str) -> Any | None:
        row = self._store.get(key)
        if not row:
            return None
        expires, value = row
        if time.monotonic() > expires:
            self._store.pop(key, None)
            return None
        return value

    def set(self, key: str, value: Any) -> None:
        self._store[key] = (time.monotonic() + self._ttl, value)


class TcgApiProvider:
    """Provedor oficial tcgapi.dev — preços e catálogo (dados agregados de mercado US)."""

    provider_id = "tcgapi"

    def __init__(self, *, api_key: str | None = None, cache_ttl: float = 3600.0) -> None:
        settings = get_settings()
        self._api_key = (api_key or settings.tcg_api_key or "").strip() or None
        self._base = TCG_API_BASE_DEFAULT
        self._http = ResilientHttpClient(timeout=12.0)
        self._cache = _TtlCache(cache_ttl)
        self._stats = {"calls": 0, "cache_hits": 0, "errors": 0, "retries": 0}

    @property
    def configured(self) -> bool:
        return bool(self._api_key)

    def stats(self) -> dict[str, int]:
        return dict(self._stats)

    def _headers(self) -> dict[str, str]:
        if not self._api_key:
            return {"Accept": "application/json"}
        return {
            "Accept": "application/json",
            "Authorization": f"Bearer {self._api_key}",
            "X-API-Key": self._api_key,
        }

    def _game_slug(self, game_code: str) -> str:
        return GAME_SLUGS.get(game_code.upper(), game_code.lower())

    async def list_sets(self, game_code: str) -> list[CatalogSet]:
        slug = self._game_slug(game_code)
        cache_key = f"sets:{slug}"
        cached = self._cache.get(cache_key)
        if cached is not None:
            self._stats["cache_hits"] += 1
            return cached

        self._stats["calls"] += 1
        res = await self._http.request(
            "GET",
            f"{self._base}/sets",
            headers=self._headers(),
            params={"game": slug, "per_page": 100},
        )
        if res is None or not res.is_success:
            self._stats["errors"] += 1
            return []

        payload = res.json()
        rows = payload.get("data") if isinstance(payload, dict) else payload
        if not isinstance(rows, list):
            return []

        sets: list[CatalogSet] = []
        for row in rows:
            if not isinstance(row, dict):
                continue
            code = str(row.get("abbreviation") or row.get("slug") or row.get("id") or "")
            if not code:
                continue
            sets.append(
                CatalogSet(
                    code=code,
                    name=str(row.get("name") or code),
                    external_id=str(row.get("id") or code),
                    release_date=row.get("release_date"),
                    card_count=row.get("card_count"),
                ),
            )

        self._cache.set(cache_key, sets)
        logger.info("tcgapi_sets_fetched", game=game_code, count=len(sets))
        return sets

    async def list_cards_in_set(
        self,
        game_code: str,
        set_ref: CatalogSet,
        *,
        limit: int | None = None,
    ) -> list[CatalogCard]:
        if not self._api_key:
            return []

        cards: list[CatalogCard] = []
        page = 1
        per_page = 100

        while True:
            if limit is not None and len(cards) >= limit:
                break

            self._stats["calls"] += 1
            res = await self._http.request(
                "GET",
                f"{self._base}/sets/{set_ref.external_id}/cards",
                headers=self._headers(),
                params={"page": page, "per_page": per_page},
            )
            if res is None or not res.is_success:
                self._stats["errors"] += 1
                break

            payload = res.json()
            rows = payload.get("data") if isinstance(payload, dict) else []
            if not isinstance(rows, list) or not rows:
                break

            for row in rows:
                if limit is not None and len(cards) >= limit:
                    break
                if not isinstance(row, dict):
                    continue
                name = str(row.get("name") or row.get("clean_name") or "Unknown")
                ext_id = str(row.get("id") or row.get("tcgplayer_id") or len(cards))
                image = row.get("image_url") or row.get("image")
                market = row.get("market_price") or row.get("price")
                tcg_id = row.get("tcgplayer_id")

                cards.append(
                    CatalogCard(
                        external_id=ext_id,
                        name=name,
                        set_code=set_ref.code,
                        set_name=set_ref.name,
                        card_number=str(row.get("number") or row.get("card_number") or "") or None,
                        rarity=row.get("rarity"),
                        card_type=row.get("type") or row.get("card_type"),
                        image_url=image,
                        source="tcgapi",
                        external_ids={"tcgplayer": str(tcg_id)} if tcg_id else {},
                        game_data={
                            k: row.get(k)
                            for k in ("foil", "printing", "language", "description")
                            if row.get(k) is not None
                        },
                        price_usd=float(market) if market else None,
                    ),
                )

            meta = payload.get("meta") if isinstance(payload, dict) else {}
            last_page = int(meta.get("last_page") or page)
            if page >= last_page:
                break
            page += 1

        return cards

    async def search_price(
        self,
        card_name: str,
        *,
        game: str,
        set_code: str | None = None,
    ) -> PriceQuote | None:
        if not self._api_key:
            return None

        cache_key = f"price:{game}:{set_code or ''}:{card_name.lower()}"
        cached = self._cache.get(cache_key)
        if cached is not None:
            self._stats["cache_hits"] += 1
            return cached

        params: dict[str, str] = {"q": card_name, "game": self._game_slug(game)}
        if set_code:
            params["set"] = set_code

        self._stats["calls"] += 1
        res = await self._http.request(
            "GET",
            f"{self._base}/search",
            headers=self._headers(),
            params=params,
        )
        if res is None or not res.is_success:
            self._stats["errors"] += 1
            return None

        data = res.json()
        row = (data.get("data") or [None])[0] if isinstance(data, dict) else None
        if not row:
            return None

        quote = PriceQuote(
            card_name=str(row.get("name") or card_name),
            market_price_usd=float(row.get("market_price") or row.get("price") or 0) or None,
            price_change_7d=row.get("price_change_7d"),
            set_name=row.get("set"),
            raw=row,
        )
        self._cache.set(cache_key, quote)
        return quote

    async def bulk_prices(self, card_names: list[str], *, game: str) -> list[PriceQuote]:
        if not self._api_key or not card_names:
            return []

        slug = self._game_slug(game)
        self._stats["calls"] += 1
        res = await self._http.request(
            "POST",
            f"{self._base}/bulk",
            headers=self._headers(),
            json={"cards": [{"name": name, "game": slug} for name in card_names]},
        )
        if res is None or not res.is_success:
            self._stats["errors"] += 1
            return []

        data = res.json()
        rows = data.get("data") if isinstance(data, dict) else []
        quotes: list[PriceQuote] = []
        for row in rows or []:
            if not isinstance(row, dict):
                continue
            quotes.append(
                PriceQuote(
                    card_name=str(row.get("name") or ""),
                    market_price_usd=float(row.get("market_price") or row.get("price") or 0) or None,
                    price_change_7d=row.get("price_change_7d"),
                    set_name=row.get("set"),
                    raw=row,
                ),
            )
        return quotes
