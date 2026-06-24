"""Sync Riftbound (RiftScribe API / Scrydex fallback) → card_catalog."""

from __future__ import annotations

import os
from typing import Any

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.tcg_adapters.set_sources import fetch_riftbound_sets
from app.tcg_adapters.sync_common import maybe_commit_batch, normalize_name, upsert_card, upsert_set

RIFTSCRIBE_API = "https://riftscribe.gg/api"
SCRYDEX_API = "https://api.scrydex.com/riftbound/v1"
PAGE_SIZE = 48


def _rift_image(card: dict[str, Any]) -> str | None:
    art = card.get("art")
    if isinstance(art, dict) and art.get("image"):
        return str(art["image"])
    image = card.get("image")
    return str(image) if image else None


async def _riftscribe_cards(client: httpx.AsyncClient, set_id: str) -> list[dict[str, Any]]:
    cards: list[dict[str, Any]] = []
    offset = 0
    while True:
        res = await client.get(
            f"{RIFTSCRIBE_API}/cards",
            params={"set_id": set_id, "limit": PAGE_SIZE, "offset": offset},
        )
        if not res.is_success:
            break
        batch = res.json()
        if not isinstance(batch, list) or not batch:
            break
        cards.extend(batch)
        if len(batch) < PAGE_SIZE:
            break
        offset += PAGE_SIZE
    return cards


async def _enrich_riftscribe_images(client: httpx.AsyncClient, card: dict[str, Any]) -> dict[str, Any]:
    if card.get("image"):
        return card
    card_id = str(card.get("id") or "")
    if not card_id:
        return card
    res = await client.get(f"{RIFTSCRIBE_API}/cards/{card_id}")
    if res.is_success and isinstance(res.json(), dict):
        return res.json()
    return card


async def sync_riftbound(session: AsyncSession, *, limit: int | None = None) -> dict[str, Any]:
    count = 0
    batch = 0
    sets_synced = 0
    source = "riftscribe"

    async with httpx.AsyncClient(timeout=120.0) as client:
        for set_row in await fetch_riftbound_sets(client):
            await upsert_set(
                session,
                game_code="RIFTBOUND",
                code=set_row["code"],
                name=set_row["name"],
                external_id=set_row["code"],
            )
            sets_synced += 1
        await session.commit()

        for set_row in await fetch_riftbound_sets(client):
            if limit is not None and count >= limit:
                break
            set_code = set_row["code"]
            cards = await _riftscribe_cards(client, set_code)
            for card in cards:
                if limit is not None and count >= limit:
                    break
                if not card.get("image"):
                    card = await _enrich_riftscribe_images(client, card)
                name = str(card.get("name") or "Unknown")
                ext_id = str(card.get("id") or f"{set_code}-{count}")
                image = _rift_image(card)
                await upsert_card(
                    session,
                    {
                        "game_code": "RIFTBOUND",
                        "external_id": ext_id,
                        "name": name,
                        "normalized_name": normalize_name(name),
                        "set_code": card.get("set_id") or set_code,
                        "set_name": set_row["name"],
                        "card_number": str(card.get("collector_number") or ""),
                        "rarity": card.get("rarity"),
                        "card_type": card.get("type"),
                        "image_url": image,
                        "image_uris": {"normal": image} if image else {},
                        "source": source,
                        "external_ids": {"riftscribe": ext_id},
                        "game_data": {
                            "domains": card.get("domains") or [card.get("faction")],
                            "faction": card.get("faction"),
                            "energy": card.get("energy"),
                            "might": card.get("might"),
                            "power": card.get("power"),
                            "text": card.get("text") or card.get("ability"),
                            "orientation": card.get("orientation"),
                            "variant": card.get("variant"),
                        },
                    },
                )
                count += 1
                batch = await maybe_commit_batch(session, batch + 1)

    if batch:
        await session.commit()
    return {
        "status": "ok",
        "game": "RIFTBOUND",
        "synced": count,
        "sets_synced": sets_synced,
        "source": source,
    }
