"""Sincronização de preços via tcgapi.dev → card_prices (Provider: TcgApiProvider)."""

from __future__ import annotations

from typing import Any

import structlog
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.infrastructure.external.providers.tcg_api_provider import TcgApiProvider

logger = structlog.get_logger(__name__)


def _get_provider() -> TcgApiProvider:
    settings = get_settings()
    return TcgApiProvider(api_key=settings.tcg_api_key)


async def fetch_tcgapi_price_cents(
    card_name: str,
    *,
    game: str = "mtg",
    set_code: str | None = None,
) -> int | None:
    provider = _get_provider()
    if not provider.configured:
        return None
    quote = await provider.search_price(card_name, game=game, set_code=set_code)
    if not quote or not quote.market_price_usd:
        return None
    cents = int(round(float(quote.market_price_usd) * 100))
    return cents if cents > 0 else None


async def sync_tcgapi_prices(
    session: AsyncSession,
    *,
    game: str = "MTG",
    limit: int = 50,
) -> dict[str, Any]:
    settings = get_settings()
    if not settings.tcg_api_key:
        return {"ok": False, "status": "skipped", "reason": "TCG_API_KEY not configured"}

    provider = _get_provider()
    game_code = game.upper()
    limit = max(1, min(limit, 200))

    rows = (
        await session.execute(
            text(
                """
                SELECT id, name
                FROM tcg_judge.card_catalog
                WHERE game_code = :game
                ORDER BY last_synced_at DESC NULLS LAST, created_at DESC
                LIMIT :lim
                """
            ),
            {"game": game_code, "lim": limit},
        )
    ).mappings().all()

    if not rows:
        return {"ok": True, "game": game_code, "fetched": 0, "upserted": 0}

    name_to_id = {str(r["name"]): str(r["id"]) for r in rows}
    quotes = await provider.bulk_prices(list(name_to_id.keys()), game=game_code)

    upserted = 0
    for quote in quotes:
        card_id = name_to_id.get(quote.card_name)
        if not card_id or not quote.market_price_usd:
            continue
        cents = int(round(float(quote.market_price_usd) * 100))
        if cents <= 0:
            continue
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.card_prices (card_id, source, currency, price_cents, condition)
                VALUES (:cid, 'tcgapi', 'USD', :cents, 'NM')
                """
            ),
            {"cid": card_id, "cents": cents},
        )
        upserted += 1

    await session.commit()
    stats = provider.stats()
    logger.info(
        "tcgapi_sync_complete",
        game=game_code,
        upserted=upserted,
        provider_stats=stats,
    )
    return {
        "ok": True,
        "game": game_code,
        "fetched": len(quotes),
        "upserted": upserted,
        "cards_queried": len(rows),
        "provider": provider.provider_id,
        "observability": stats,
    }
