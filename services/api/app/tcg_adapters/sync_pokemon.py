"""Sync TCGdex → card_catalog."""

from __future__ import annotations

from typing import Any

import httpx
from app.tcg_adapters.sync_common import normalize_name, upsert_card
from sqlalchemy.ext.asyncio import AsyncSession

TCGDEX_SETS = "https://api.tcgdex.net/v2/en/sets"


async def sync_tcgdex(session: AsyncSession, *, max_sets: int | None = 3) -> dict[str, Any]:
    count = 0
    async with httpx.AsyncClient(timeout=60.0) as client:
        sets_res = await client.get(TCGDEX_SETS)
        sets_res.raise_for_status()
        sets_list = sets_res.json()

        for i, set_summary in enumerate(sets_list):
            if max_sets and i >= max_sets:
                break
            set_id = set_summary["id"]
            detail = await client.get(f"https://api.tcgdex.net/v2/en/sets/{set_id}")
            if detail.status_code != 200:
                continue
            set_data = detail.json()
            for card in set_data.get("cards", []):
                await upsert_card(
                    session,
                    {
                        "game_code": "POKEMON",
                        "external_id": card.get("id", f"{set_id}-{card.get('localId', count)}"),
                        "name": card.get("name", "Unknown"),
                        "normalized_name": normalize_name(card.get("name", "")),
                        "set_code": set_id,
                        "set_name": set_data.get("name"),
                        "card_number": str(card.get("localId", "")),
                        "rarity": card.get("rarity"),
                        "card_type": (card.get("category") or "Pokemon"),
                        "game_data": {
                            "hp": card.get("hp"),
                            "types": card.get("types"),
                            "stage": card.get("stage"),
                        },
                    },
                )
                count += 1

    await session.commit()
    return {"status": "ok", "game": "POKEMON", "synced": count}
