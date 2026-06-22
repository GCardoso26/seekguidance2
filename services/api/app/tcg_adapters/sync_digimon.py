"""Sync Digimon TCG (digimoncard.io) → card_catalog."""

from __future__ import annotations

from asyncio import sleep
from typing import Any

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.tcg_adapters.sync_common import maybe_commit_batch, normalize_name, upsert_card

DIGIMON_SEARCH = "https://digimoncard.io/api-public/search.php"


async def sync_digimon(session: AsyncSession, *, limit: int | None = 500) -> dict[str, Any]:
    count = 0
    batch = 0
    page = 0

    async with httpx.AsyncClient(timeout=60.0) as client:
        while True:
            if limit and count >= limit:
                break
            res = await client.get(DIGIMON_SEARCH, params={"series": "all", "limit": 100, "page": page})
            if not res.is_success:
                break
            payload = res.json()
            cards = payload if isinstance(payload, list) else payload.get("data") or []
            if not cards:
                break

            for card in cards:
                if limit and count >= limit:
                    break
                ext_id = str(card.get("cardnumber") or card.get("id") or count)
                image = card.get("image_url") or card.get("image")
                await upsert_card(
                    session,
                    {
                        "game_code": "DIGIMON",
                        "external_id": ext_id,
                        "name": card.get("name", "Unknown"),
                        "normalized_name": normalize_name(card.get("name", "")),
                        "set_code": card.get("setname") or card.get("set"),
                        "set_name": card.get("setname"),
                        "card_number": str(card.get("cardnumber") or ""),
                        "rarity": card.get("rarity"),
                        "card_type": card.get("type"),
                        "image_url": image,
                        "image_uris": {"normal": image} if image else {},
                        "source": "digimoncard",
                        "external_ids": {"digimoncard": ext_id},
                        "game_data": {
                            "level": card.get("level"),
                            "play_cost": card.get("play_cost"),
                            "digivolve_cost": card.get("digivolve_cost"),
                            "color": card.get("color"),
                            "attribute": card.get("attribute"),
                            "text": card.get("description") or card.get("main_effect"),
                        },
                    },
                )
                count += 1
                batch = await maybe_commit_batch(session, batch + 1)

            page += 1
            await sleep(0.7)

    if batch:
        await session.commit()
    return {"status": "ok", "game": "DIGIMON", "synced": count, "source": "digimoncard"}
