"""Sync Lorcana API → card_catalog."""

from __future__ import annotations

from typing import Any

import httpx
from app.tcg_adapters.sync_common import normalize_name, upsert_card
from sqlalchemy.ext.asyncio import AsyncSession

LORCANA_API = "https://api.lorcana-api.com/bulk/cards"


async def sync_lorcana(session: AsyncSession) -> dict[str, Any]:
    count = 0
    async with httpx.AsyncClient(timeout=60.0) as client:
        res = await client.get(LORCANA_API)
        if res.status_code != 200:
            return {"status": "error", "message": f"HTTP {res.status_code}"}
        cards = res.json()
        if isinstance(cards, dict):
            cards = cards.get("cards", cards.get("data", []))

        for card in cards:
            await upsert_card(
                session,
                {
                    "game_code": "LORCANA",
                    "external_id": str(card.get("Unique_ID") or card.get("id") or count),
                    "name": card.get("Name") or card.get("name", "Unknown"),
                    "normalized_name": normalize_name(card.get("Name") or card.get("name", "")),
                    "set_code": card.get("Set_ID") or card.get("set"),
                    "card_number": str(card.get("Card_Num") or card.get("number") or ""),
                    "rarity": card.get("Rarity") or card.get("rarity"),
                    "card_type": card.get("Type") or card.get("type"),
                    "game_data": {
                        "ink_cost": card.get("Cost") or card.get("cost"),
                        "inkable": card.get("Inkable") or card.get("inkwell"),
                        "classification": card.get("Classifications"),
                    },
                },
            )
            count += 1

    await session.commit()
    return {"status": "ok", "game": "LORCANA", "synced": count}
