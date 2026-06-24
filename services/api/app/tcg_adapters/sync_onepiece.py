"""Sync One Piece TCG (optcgapi.com) → card_catalog."""

from __future__ import annotations

from typing import Any

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.tcg_adapters.set_sources import fetch_onepiece_sets
from app.tcg_adapters.sync_common import maybe_commit_batch, normalize_name, upsert_card, upsert_set

OPTCG_API = "https://optcgapi.com/api"


def _onepiece_image(card: dict[str, Any]) -> str | None:
    return (
        card.get("card_image")
        or card.get("image_url")
        or card.get("image")
    )


async def sync_onepiece(session: AsyncSession, *, limit: int | None = None) -> dict[str, Any]:
    count = 0
    batch = 0
    sets_synced = 0
    async with httpx.AsyncClient(timeout=120.0) as client:
        for set_row in await fetch_onepiece_sets(client):
            await upsert_set(
                session,
                game_code="ONEPIECE",
                code=set_row["code"],
                name=set_row["name"],
                external_id=set_row["code"],
                release_date=set_row.get("release_date"),
            )
            sets_synced += 1
        await session.commit()

        res = await client.get(f"{OPTCG_API}/allSetCards/")
        if not res.is_success:
            return {"status": "error", "message": f"HTTP {res.status_code}"}
        cards = res.json()
        if isinstance(cards, dict):
            cards = cards.get("data") or cards.get("cards") or []

    for card in cards:
        if limit and count >= limit:
            break
        ext_id = str(card.get("card_set_id") or card.get("card_id") or card.get("id") or count)
        image = _onepiece_image(card)
        await upsert_card(
            session,
            {
                "game_code": "ONEPIECE",
                "external_id": ext_id,
                "name": card.get("card_name") or card.get("name", "Unknown"),
                "normalized_name": normalize_name(card.get("card_name") or card.get("name", "")),
                "set_code": card.get("set_id") or card.get("set"),
                "set_name": card.get("set_name"),
                "card_number": str(card.get("card_number") or card.get("number") or ""),
                "rarity": card.get("rarity"),
                "card_type": card.get("card_type") or card.get("type"),
                "image_url": image,
                "image_uris": {"normal": image} if image else {},
                "source": "optcgapi",
                "external_ids": {"optcgapi": ext_id},
                "game_data": {
                    "cost": card.get("card_cost") or card.get("cost"),
                    "power": card.get("card_power") or card.get("power"),
                    "counter": card.get("counter_amount") or card.get("counter"),
                    "attribute": card.get("attribute"),
                    "text": card.get("card_text") or card.get("effect"),
                },
            },
        )
        count += 1
        batch = await maybe_commit_batch(session, batch + 1)

    if batch:
        await session.commit()
    return {
        "status": "ok",
        "game": "ONEPIECE",
        "synced": count,
        "sets_synced": sets_synced,
        "source": "optcgapi",
    }
