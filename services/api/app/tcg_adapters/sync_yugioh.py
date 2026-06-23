"""Sync YGOPRODeck → card_catalog."""

from __future__ import annotations

from typing import Any

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.tcg_adapters.sync_common import maybe_commit_batch, normalize_name, upsert_card

YGOPRODECK_CARDS = "https://db.ygoprodeck.com/api/v7/cardinfo.php"


async def _upsert_yugioh_card(session: AsyncSession, card: dict[str, Any]) -> None:
    card_sets = card.get("card_sets") or [{}]
    primary_set = card_sets[0] if card_sets else {}
    images = card.get("card_images") or [{}]
    image = images[0].get("image_url") if images else None
    card_id = str(card.get("id", ""))

    await upsert_card(
        session,
        {
            "game_code": "YGO",
            "external_id": card_id,
            "name": card.get("name", "Unknown"),
            "normalized_name": normalize_name(card.get("name", "")),
            "set_code": primary_set.get("set_code"),
            "set_name": primary_set.get("set_name"),
            "card_number": primary_set.get("set_rarity_code"),
            "rarity": primary_set.get("set_rarity"),
            "card_type": card.get("type"),
            "game_specific_type": card.get("frameType"),
            "image_url": image,
            "image_uris": {"normal": image} if image else {},
            "language": "en",
            "source": "ygoprodeck",
            "external_ids": {"ygoprodeck": card_id},
            "game_data": {
                "desc": card.get("desc"),
                "atk": card.get("atk"),
                "def": card.get("def"),
                "level": card.get("level"),
                "attribute": card.get("attribute"),
                "race": card.get("race"),
                "archetype": card.get("archetype"),
                "linkval": card.get("linkval"),
                "linkmarkers": card.get("linkmarkers"),
            },
        },
    )


async def _sync_yugioh_paginated(session: AsyncSession, *, limit: int) -> dict[str, Any]:
    count = 0
    batch = 0
    offset = 0
    page_size = min(100, limit)
    async with httpx.AsyncClient(timeout=60.0) as client:
        while count < limit:
            res = await client.get(
                YGOPRODECK_CARDS,
                params={"num": page_size, "offset": offset},
            )
            if res.status_code == 400:
                break
            res.raise_for_status()
            cards = res.json().get("data") or []
            if not cards:
                break
            for card in cards:
                if count >= limit:
                    break
                await _upsert_yugioh_card(session, card)
                count += 1
                batch = await maybe_commit_batch(session, batch + 1)
            if len(cards) < page_size:
                break
            offset += page_size

    if batch:
        await session.commit()
    return {"status": "ok", "game": "YGO", "synced": count, "source": "ygoprodeck", "mode": "paginated"}


async def sync_yugioh(session: AsyncSession, *, limit: int | None = None) -> dict[str, Any]:
    if limit is not None:
        return await _sync_yugioh_paginated(session, limit=limit)

    count = 0
    batch = 0
    async with httpx.AsyncClient(timeout=120.0) as client:
        res = await client.get(YGOPRODECK_CARDS)
        res.raise_for_status()
        cards = res.json().get("data") or []

    for card in cards:
        await _upsert_yugioh_card(session, card)
        count += 1
        batch = await maybe_commit_batch(session, batch + 1)

    if batch:
        await session.commit()
    return {"status": "ok", "game": "YGO", "synced": count, "source": "ygoprodeck", "mode": "bulk"}
