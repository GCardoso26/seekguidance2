"""Sincronização de preços via tcgapi.dev → card_prices."""

from __future__ import annotations

from typing import Any

import httpx
import structlog
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings

logger = structlog.get_logger(__name__)

TCG_API_BASE = "https://api.tcgapi.dev/v1"


async def _fetch_bulk_prices(
    card_names: list[str],
    *,
    game: str,
    api_key: str,
) -> list[dict[str, Any]]:
    if not card_names:
        return []
    game_slug = game.lower()
    async with httpx.AsyncClient(timeout=30.0) as client:
        res = await client.post(
            f"{TCG_API_BASE}/bulk",
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={"cards": [{"name": name, "game": game_slug} for name in card_names]},
        )
        if res.status_code != 200:
            logger.warning("tcgapi_bulk_failed", status=res.status_code)
            return []
        data = res.json()
        return list(data.get("data") or [])


async def fetch_tcgapi_price_cents(
    card_name: str,
    *,
    game: str = "mtg",
    set_code: str | None = None,
) -> int | None:
    settings = get_settings()
    if not settings.tcg_api_key:
        return None
    params: dict[str, str] = {"q": card_name, "game": game.lower()}
    if set_code:
        params["set"] = set_code
    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            res = await client.get(
                f"{TCG_API_BASE}/search",
                headers={"Authorization": f"Bearer {settings.tcg_api_key}"},
                params=params,
            )
            if res.status_code != 200:
                return None
            data = res.json()
            row = (data.get("data") or [None])[0]
            if not row:
                return None
            usd = float(row.get("market_price") or row.get("price") or 0)
            cents = int(round(usd * 100))
            return cents if cents > 0 else None
    except Exception as exc:
        logger.debug("tcgapi_search_failed", error=str(exc), card=card_name)
        return None


async def sync_tcgapi_prices(
    session: AsyncSession,
    *,
    game: str = "MTG",
    limit: int = 50,
) -> dict[str, Any]:
    settings = get_settings()
    if not settings.tcg_api_key:
        return {"ok": False, "status": "skipped", "reason": "TCG_API_KEY not configured"}

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
    prices = await _fetch_bulk_prices(list(name_to_id.keys()), game=game_code, api_key=settings.tcg_api_key)

    upserted = 0
    for row in prices:
        name = str(row.get("name") or "")
        card_id = name_to_id.get(name)
        if not card_id:
            continue
        usd = float(row.get("market_price") or row.get("price") or 0)
        cents = int(round(usd * 100))
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
    return {
        "ok": True,
        "game": game_code,
        "fetched": len(prices),
        "upserted": upserted,
        "cards_queried": len(rows),
    }
