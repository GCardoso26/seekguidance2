"""Sync Lorcana (lorcana-api.com) → card_catalog."""

from __future__ import annotations

from typing import Any

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.tcg_adapters.set_sources import fetch_lorcana_sets
from app.tcg_adapters.sync_common import maybe_commit_batch, normalize_name, upsert_card, upsert_set

LORCANA_API = "https://api.lorcana-api.com/bulk/cards"


def _lorcana_image(card: dict[str, Any]) -> str | None:
    image_uris = card.get("image_uris")
    if isinstance(image_uris, dict):
        return image_uris.get("normal")
    return card.get("Image") or card.get("image")


async def sync_lorcana(session: AsyncSession, *, limit: int | None = None) -> dict[str, Any]:
    count = 0
    batch = 0
    sets_synced = 0
    async with httpx.AsyncClient(timeout=90.0) as client:
        for set_row in await fetch_lorcana_sets(client):
            await upsert_set(
                session,
                game_code="LORCANA",
                code=set_row["code"],
                name=set_row["name"],
                external_id=set_row["code"],
                release_date=set_row.get("release_date"),
                card_count=set_row.get("card_count"),
            )
            sets_synced += 1
        await session.commit()

        res = await client.get(LORCANA_API)
        if not res.is_success:
            return {"status": "error", "message": f"HTTP {res.status_code}"}
        cards = res.json()
        if isinstance(cards, dict):
            cards = cards.get("cards", cards.get("data", []))

        for card in cards:
            if limit is not None and count >= limit:
                break
            name = card.get("Name") or card.get("name") or "Unknown"
            ext_id = str(card.get("Unique_ID") or card.get("id") or count)
            image = _lorcana_image(card)
            set_code = card.get("Set_ID") or card.get("set")
            set_name = card.get("Set_Name") or card.get("set_name") or set_code
            await upsert_card(
                session,
                {
                    "game_code": "LORCANA",
                    "external_id": ext_id,
                    "name": name,
                    "normalized_name": normalize_name(name),
                    "set_code": set_code,
                    "set_name": set_name,
                    "card_number": str(
                        card.get("Card_Num")
                        or card.get("collector_number")
                        or card.get("number")
                        or ""
                    ),
                    "rarity": card.get("Rarity") or card.get("rarity"),
                    "card_type": card.get("Type") or card.get("type"),
                    "image_url": image,
                    "image_uris": {"normal": image} if image else {},
                    "source": "lorcana-api",
                    "external_ids": {"lorcana_api": ext_id},
                    "game_data": {
                        "ink_cost": card.get("Cost") or card.get("cost"),
                        "inkable": card.get("Inkable") or card.get("inkwell"),
                        "text": card.get("Body_Text") or card.get("text"),
                        "classification": card.get("Classifications") or card.get("classifications"),
                        "lore": card.get("Lore"),
                        "strength": card.get("Strength"),
                        "willpower": card.get("Willpower"),
                    },
                },
            )
            count += 1
            batch = await maybe_commit_batch(session, batch + 1)

    if batch:
        await session.commit()
    return {
        "status": "ok",
        "game": "LORCANA",
        "synced": count,
        "sets_synced": sets_synced,
        "source": "lorcana-api",
    }
