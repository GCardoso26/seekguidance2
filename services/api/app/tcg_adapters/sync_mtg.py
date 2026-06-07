"""Sync Scryfall → card_catalog."""

from __future__ import annotations

from typing import Any

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.tcg_adapters.sync_common import normalize_name, upsert_card

SCRYFALL_BULK = "https://api.scryfall.com/bulk-data"


async def sync_scryfall(session: AsyncSession, *, limit: int | None = None) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=120.0) as client:
        bulk_res = await client.get(SCRYFALL_BULK)
        bulk_res.raise_for_status()
        entries = bulk_res.json().get("data", [])
        oracle = next((b for b in entries if b.get("type") == "oracle_cards"), None)
        if not oracle:
            return {"status": "error", "message": "oracle_cards bulk não encontrado"}

        download = await client.get(oracle["download_uri"])
        download.raise_for_status()
        cards = download.json()

    count = 0
    for card in cards:
        if limit and count >= limit:
            break
        if card.get("layout") in ("token", "art_series", "double_faced_token"):
            continue
        legalities = {k.upper(): v for k, v in (card.get("legalities") or {}).items()}
        image = (card.get("image_uris") or {}).get("normal")
        await upsert_card(
            session,
            {
                "game_code": "MTG",
                "external_id": card["id"],
                "name": card["name"],
                "normalized_name": normalize_name(card["name"]),
                "set_code": card.get("set"),
                "set_name": card.get("set_name"),
                "card_number": card.get("collector_number"),
                "rarity": card.get("rarity"),
                "card_type": card.get("type_line"),
                "legality": legalities,
                "image_url": image,
                "game_data": {
                    "mana_cost": card.get("mana_cost"),
                    "cmc": card.get("cmc"),
                    "colors": card.get("colors") or [],
                },
            },
        )
        count += 1

    await session.commit()
    return {"status": "ok", "game": "MTG", "synced": count}
