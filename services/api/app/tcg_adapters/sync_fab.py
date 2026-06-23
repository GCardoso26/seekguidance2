"""Sync Flesh and Blood (the-fab-cube JSON) → card_catalog."""

from __future__ import annotations

from typing import Any

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.tcg_adapters.sync_common import maybe_commit_batch, normalize_name, upsert_card

FAB_JSON = (
    "https://raw.githubusercontent.com/the-fab-cube/flesh-and-blood-cards/v8.1.0/json/english/card.json"
)


def _fab_image(card: dict[str, Any]) -> str | None:
    printings = card.get("printings")
    if isinstance(printings, list) and printings:
        return printings[0].get("image_url")
    if isinstance(printings, dict):
        return printings.get("image_url")
    return card.get("image_url") or card.get("image")


def _fab_printing(card: dict[str, Any]) -> dict[str, Any]:
    printings = card.get("printings")
    if isinstance(printings, list) and printings:
        return printings[0]
    if isinstance(printings, dict):
        return printings
    return {}


async def sync_fab(session: AsyncSession, *, limit: int | None = None) -> dict[str, Any]:
    count = 0
    batch = 0
    async with httpx.AsyncClient(timeout=120.0) as client:
        res = await client.get(FAB_JSON)
        if not res.is_success:
            return {"status": "error", "message": f"HTTP {res.status_code}"}
        payload = res.json()
        cards = payload if isinstance(payload, list) else list(payload.values())

    for card in cards:
        if limit and count >= limit:
            break
        printing = _fab_printing(card)
        ext_id = str(card.get("unique_id") or printing.get("unique_id") or count)
        image = _fab_image(card)
        await upsert_card(
            session,
            {
                "game_code": "FAB",
                "external_id": ext_id,
                "name": card.get("name", "Unknown"),
                "normalized_name": normalize_name(card.get("name", "")),
                "set_code": printing.get("set_id") or card.get("set_code") or card.get("set"),
                "set_name": card.get("set_name"),
                "card_number": str(printing.get("id") or card.get("number") or ""),
                "rarity": printing.get("rarity") or card.get("rarity"),
                "card_type": ", ".join(card.get("types") or []) or card.get("type") or card.get("card_type"),
                "image_url": image,
                "image_uris": {"normal": image} if image else {},
                "source": "fab-cube",
                "external_ids": {"fab_cube": ext_id},
                "game_data": {
                    "pitch": card.get("pitch"),
                    "cost": card.get("cost"),
                    "power": card.get("power"),
                    "defense": card.get("defense"),
                    "text": card.get("functional_text") or card.get("functional_text_plain"),
                    "keywords": card.get("card_keywords") or card.get("keywords"),
                },
            },
        )
        count += 1
        batch = await maybe_commit_batch(session, batch + 1)

    if batch:
        await session.commit()
    return {"status": "ok", "game": "FAB", "synced": count, "source": "fab-cube"}
