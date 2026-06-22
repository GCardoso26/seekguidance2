"""Sync Lorcana (Lorcast API) → card_catalog."""

from __future__ import annotations

from typing import Any

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.tcg_adapters.sync_common import maybe_commit_batch, normalize_name, upsert_card

LORCAST_API = "https://lorcast.com/api/cards"
LORCANA_FALLBACK = "https://api.lorcana-api.com/bulk/cards"


async def sync_lorcana(session: AsyncSession) -> dict[str, Any]:
    count = 0
    batch = 0
    async with httpx.AsyncClient(timeout=90.0) as client:
        res = await client.get(LORCAST_API)
        if not res.is_success:
            res = await client.get(LORCANA_FALLBACK)
        if not res.is_success:
            return {"status": "error", "message": f"HTTP {res.status_code}"}
        cards = res.json()
        if isinstance(cards, dict):
            cards = cards.get("cards", cards.get("data", []))

        for card in cards:
            name = card.get("name") or card.get("Name") or "Unknown"
            ext_id = str(card.get("id") or card.get("Unique_ID") or count)
            image = (card.get("image_uris") or {}).get("normal") if isinstance(card.get("image_uris"), dict) else card.get("image")
            await upsert_card(
                session,
                {
                    "game_code": "LORCANA",
                    "external_id": ext_id,
                    "name": name,
                    "normalized_name": normalize_name(name),
                    "set_code": card.get("set") or card.get("Set_ID"),
                    "set_name": card.get("set_name") or card.get("set"),
                    "card_number": str(card.get("collector_number") or card.get("Card_Num") or card.get("number") or ""),
                    "rarity": card.get("rarity") or card.get("Rarity"),
                    "card_type": card.get("type") or card.get("Type"),
                    "image_url": image,
                    "image_uris": {"normal": image} if image else {},
                    "source": "lorcast",
                    "external_ids": {"lorcast": ext_id},
                    "game_data": {
                        "ink_cost": card.get("cost") or card.get("Cost"),
                        "inkable": card.get("inkwell") or card.get("Inkable"),
                        "text": card.get("text") or card.get("Body_Text"),
                        "classification": card.get("classifications") or card.get("Classifications"),
                    },
                },
            )
            count += 1
            batch = await maybe_commit_batch(session, batch + 1)

    if batch:
        await session.commit()
    return {"status": "ok", "game": "LORCANA", "synced": count, "source": "lorcast"}
