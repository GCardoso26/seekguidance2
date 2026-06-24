"""Sync Flesh and Blood (the-fab-cube JSON) → card_catalog."""

from __future__ import annotations

from typing import Any

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.tcg_adapters.set_sources import fetch_fab_sets
from app.tcg_adapters.sync_common import maybe_commit_batch, normalize_name, upsert_card, upsert_set

FAB_JSON = (
    "https://raw.githubusercontent.com/the-fab-cube/flesh-and-blood-cards/v8.1.0/json/english/card.json"
)


def _fab_printings(card: dict[str, Any]) -> list[dict[str, Any]]:
    printings = card.get("printings")
    if isinstance(printings, list):
        return [p for p in printings if isinstance(p, dict)]
    if isinstance(printings, dict):
        return [printings]
    return []


async def sync_fab(session: AsyncSession, *, limit: int | None = None) -> dict[str, Any]:
    count = 0
    batch = 0
    sets_synced = 0
    set_lookup: dict[str, str] = {}

    async with httpx.AsyncClient(timeout=120.0) as client:
        for set_row in await fetch_fab_sets(client):
            set_lookup[set_row["code"]] = set_row["name"]
            await upsert_set(
                session,
                game_code="FAB",
                code=set_row["code"],
                name=set_row["name"],
                external_id=set_row["code"],
                release_date=set_row.get("release_date"),
            )
            sets_synced += 1
        await session.commit()

        res = await client.get(FAB_JSON)
        if not res.is_success:
            return {"status": "error", "message": f"HTTP {res.status_code}"}
        payload = res.json()
        cards = payload if isinstance(payload, list) else list(payload.values())

    for card in cards:
        printings = _fab_printings(card)
        if not printings:
            printings = [{}]

        for printing in printings:
            if limit and count >= limit:
                break

            set_code = printing.get("set_id") or card.get("set_code") or card.get("set")
            ext_id = str(
                printing.get("unique_id")
                or card.get("unique_id")
                or f"{card.get('name', 'unknown')}-{set_code}-{printing.get('id')}"
            )
            image = printing.get("image_url") or card.get("image_url") or card.get("image")
            set_name = set_lookup.get(str(set_code or "")) or card.get("set_name")

            await upsert_card(
                session,
                {
                    "game_code": "FAB",
                    "external_id": ext_id,
                    "name": card.get("name", "Unknown"),
                    "normalized_name": normalize_name(card.get("name", "")),
                    "set_code": set_code,
                    "set_name": set_name,
                    "card_number": str(printing.get("id") or card.get("number") or ""),
                    "rarity": printing.get("rarity") or card.get("rarity"),
                    "card_type": ", ".join(card.get("types") or []) or card.get("type") or card.get("card_type"),
                    "image_url": image,
                    "image_uris": {"normal": image} if image else {},
                    "source": "fab-cube",
                    "external_ids": {"fab_cube": ext_id},
                    "is_reprint": len(printings) > 1,
                    "game_data": {
                        "pitch": card.get("pitch"),
                        "cost": card.get("cost"),
                        "power": card.get("power"),
                        "defense": card.get("defense"),
                        "text": card.get("functional_text") or card.get("functional_text_plain"),
                        "keywords": card.get("card_keywords") or card.get("keywords"),
                        "foiling": printing.get("foiling"),
                        "art_variations": printing.get("art_variations"),
                    },
                },
            )
            count += 1
            batch = await maybe_commit_batch(session, batch + 1)

        if limit and count >= limit:
            break

    if batch:
        await session.commit()
    return {
        "status": "ok",
        "game": "FAB",
        "synced": count,
        "sets_synced": sets_synced,
        "source": "fab-cube",
    }
