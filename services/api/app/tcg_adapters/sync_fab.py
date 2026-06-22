"""Sync Flesh and Blood (goagain.dev) → card_catalog."""

from __future__ import annotations

from typing import Any

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.tcg_adapters.sync_common import maybe_commit_batch, normalize_name, upsert_card

FAB_API = "https://goagain.dev/api"


async def sync_fab(session: AsyncSession, *, limit: int | None = None) -> dict[str, Any]:
    count = 0
    batch = 0
    async with httpx.AsyncClient(timeout=120.0) as client:
        res = await client.get(f"{FAB_API}/cards")
        if not res.is_success:
            return {"status": "error", "message": f"HTTP {res.status_code}"}
        payload = res.json()
        cards = payload if isinstance(payload, list) else payload.get("data") or payload.get("cards") or []

    for card in cards:
        if limit and count >= limit:
            break
        ext_id = str(card.get("unique_id") or card.get("id") or card.get("card_unique") or count)
        image = card.get("image_url") or card.get("image")
        await upsert_card(
            session,
            {
                "game_code": "FAB",
                "external_id": ext_id,
                "name": card.get("name", "Unknown"),
                "normalized_name": normalize_name(card.get("name", "")),
                "set_code": card.get("set_code") or card.get("set"),
                "set_name": card.get("set_name"),
                "card_number": str(card.get("number") or ""),
                "rarity": card.get("rarity"),
                "card_type": card.get("type") or card.get("card_type"),
                "image_url": image,
                "image_uris": {"normal": image} if image else {},
                "source": "goagain",
                "external_ids": {"goagain": ext_id},
                "game_data": {
                    "pitch": card.get("pitch"),
                    "cost": card.get("cost"),
                    "power": card.get("power"),
                    "defense": card.get("defense"),
                    "text": card.get("functional_text") or card.get("text"),
                    "keywords": card.get("keywords"),
                },
            },
        )
        count += 1
        batch = await maybe_commit_batch(session, batch + 1)

    if batch:
        await session.commit()
    return {"status": "ok", "game": "FAB", "synced": count, "source": "goagain"}
