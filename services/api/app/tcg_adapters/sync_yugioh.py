"""Sync YGOPRODeck → card_catalog."""

from __future__ import annotations

from typing import Any

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.tcg_adapters.sync_common import normalize_name, upsert_card

YGOPRODECK_CARDS = "https://db.ygoprodeck.com/api/v7/cardinfo.php"


async def sync_yugioh(session: AsyncSession, *, limit: int | None = None) -> dict[str, Any]:
    count = 0
    async with httpx.AsyncClient(timeout=120.0) as client:
        res = await client.get(YGOPRODECK_CARDS)
        res.raise_for_status()
        payload = res.json()
        cards = payload.get("data") or []

    for card in cards:
        if limit and count >= limit:
            break
        card_sets = card.get("card_sets") or [{}]
        primary_set = card_sets[0] if card_sets else {}
        images = card.get("card_images") or [{}]
        image = images[0].get("image_url") if images else None
        card_id = str(card.get("id", count))

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
        count += 1

    await session.commit()
    return {"status": "ok", "game": "YGO", "synced": count}
