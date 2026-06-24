"""Sync Star Wars Unlimited (swu-db.com API) → card_catalog."""

from __future__ import annotations

from typing import Any

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.tcg_adapters.set_sources import fetch_swu_sets
from app.tcg_adapters.sync_common import maybe_commit_batch, normalize_name, upsert_card, upsert_set

SWU_API = "https://api.swu-db.com"


def _swu_cards_payload(payload: Any) -> list[dict[str, Any]]:
    if isinstance(payload, list):
        return [row for row in payload if isinstance(row, dict)]
    if isinstance(payload, dict):
        data = payload.get("data")
        if isinstance(data, list):
            return [row for row in data if isinstance(row, dict)]
    return []


def _swu_external_id(card: dict[str, Any]) -> str:
    set_code = str(card.get("Set") or card.get("set") or "UNK")
    number = str(card.get("Number") or card.get("number") or "0")
    variant = str(card.get("VariantType") or card.get("variant") or "Normal")
    return f"{set_code}-{number}-{variant}"


def _swu_image(card: dict[str, Any]) -> str | None:
    image = card.get("FrontArt") or card.get("frontArt") or card.get("image_url")
    if image:
        return str(image)
    set_code = str(card.get("Set") or "").lower()
    number = str(card.get("Number") or "")
    if set_code and number:
        return f"https://cdn.swu-db.com/images/cards/{set_code.upper()}/{number}.png"
    return None


async def sync_swu(session: AsyncSession, *, limit: int | None = None) -> dict[str, Any]:
    count = 0
    batch = 0
    sets_synced = 0

    async with httpx.AsyncClient(timeout=120.0) as client:
        source_sets = await fetch_swu_sets(client)
        for set_row in source_sets:
            await upsert_set(
                session,
                game_code="SWU",
                code=set_row["code"],
                name=set_row["name"],
                external_id=set_row["code"],
                release_date=set_row.get("release_date"),
                card_count=set_row.get("card_count"),
            )
            sets_synced += 1
        await session.commit()

        for set_row in source_sets:
            if limit is not None and count >= limit:
                break
            set_code = str(set_row["code"]).lower()
            res = await client.get(f"{SWU_API}/cards/{set_code}")
            if not res.is_success:
                continue
            for card in _swu_cards_payload(res.json()):
                if limit is not None and count >= limit:
                    break
                name = str(card.get("Name") or card.get("name") or "Unknown")
                ext_id = _swu_external_id(card)
                image = _swu_image(card)
                await upsert_card(
                    session,
                    {
                        "game_code": "SWU",
                        "external_id": ext_id,
                        "name": name,
                        "normalized_name": normalize_name(name),
                        "set_code": card.get("Set") or set_row["code"],
                        "set_name": set_row["name"],
                        "card_number": str(card.get("Number") or ""),
                        "rarity": card.get("Rarity"),
                        "card_type": card.get("Type"),
                        "image_url": image,
                        "image_uris": {"normal": image} if image else {},
                        "source": "swu-db",
                        "external_ids": {"swu_db": ext_id},
                        "game_data": {
                            "cost": card.get("Cost"),
                            "power": card.get("Power"),
                            "hp": card.get("HP"),
                            "aspects": card.get("Aspects"),
                            "traits": card.get("Traits"),
                            "arenas": card.get("Arenas"),
                            "text": card.get("FrontText"),
                            "subtitle": card.get("Subtitle"),
                            "unique": card.get("Unique"),
                            "variant_type": card.get("VariantType"),
                        },
                    },
                )
                count += 1
                batch = await maybe_commit_batch(session, batch + 1)

    if batch:
        await session.commit()
    return {
        "status": "ok",
        "game": "SWU",
        "synced": count,
        "sets_synced": sets_synced,
        "source": "swu-db",
    }
