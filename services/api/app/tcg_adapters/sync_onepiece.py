"""Sync One Piece TCG (optcgapi.com) → card_catalog."""

from __future__ import annotations

from typing import Any

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.tcg_adapters.sync_common import maybe_commit_batch, normalize_name, upsert_card

OPTCG_API = "https://optcgapi.com/api"


async def sync_onepiece(session: AsyncSession, *, limit: int | None = None) -> dict[str, Any]:
    count = 0
    batch = 0
    async with httpx.AsyncClient(timeout=120.0) as client:
        res = await client.get(f"{OPTCG_API}/cards")
        if not res.is_success:
            return {"status": "error", "message": f"HTTP {res.status_code}"}
        cards = res.json()
        if isinstance(cards, dict):
            cards = cards.get("data") or cards.get("cards") or []

    for card in cards:
        if limit and count >= limit:
            break
        ext_id = str(card.get("card_id") or card.get("id") or count)
        image = card.get("image_url") or card.get("image")
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
                    "cost": card.get("cost"),
                    "power": card.get("power"),
                    "counter": card.get("counter"),
                    "attribute": card.get("attribute"),
                    "text": card.get("card_text") or card.get("effect"),
                },
            },
        )
        count += 1
        batch = await maybe_commit_batch(session, batch + 1)

    if batch:
        await session.commit()
    return {"status": "ok", "game": "ONEPIECE", "synced": count, "source": "optcgapi"}
