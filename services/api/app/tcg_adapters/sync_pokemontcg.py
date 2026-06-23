"""Sync Pokémon TCG API (pokemontcg.io) → card_catalog."""

from __future__ import annotations

import os
from typing import Any

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.tcg_adapters.sync_common import maybe_commit_batch, normalize_name, upsert_card, upsert_set

POKEMON_API = "https://api.pokemontcg.io/v2"
PAGE_SIZE = 250


def _headers() -> dict[str, str]:
    key = os.getenv("POKEMON_TCG_API_KEY", "").strip()
    h = {"Accept": "application/json"}
    if key:
        h["X-Api-Key"] = key
    return h


async def sync_pokemontcg(session: AsyncSession, *, max_pages: int | None = None) -> dict[str, Any]:
    count = 0
    batch = 0
    page = 1

    async with httpx.AsyncClient(timeout=90.0, headers=_headers()) as client:
        sets_res = await client.get(f"{POKEMON_API}/sets", params={"pageSize": 250})
        if sets_res.is_success:
            for s in sets_res.json().get("data", []):
                await upsert_set(
                    session,
                    game_code="POKEMON",
                    code=s.get("id") or s.get("name", ""),
                    name=s.get("name", "Unknown"),
                    external_id=s.get("id"),
                    release_date=s.get("releaseDate"),
                    card_count=s.get("total"),
                    icon_url=(s.get("images") or {}).get("symbol"),
                )
            await session.commit()

        while True:
            if max_pages and page > max_pages:
                break
            res = await client.get(
                f"{POKEMON_API}/cards",
                params={"page": page, "pageSize": PAGE_SIZE},
            )
            if not res.is_success:
                break
            payload = res.json()
            cards = payload.get("data") or []
            if not cards:
                break

            for card in cards:
                set_info = card.get("set") or {}
                images = card.get("images") or {}
                image = images.get("large") or images.get("small")
                ext_id = card.get("id") or f"pkm-{count}"
                prices = (card.get("tcgplayer") or {}).get("prices") or {}
                nm = prices.get("normal") or prices.get("holofoil") or {}
                price_usd = nm.get("market") or nm.get("mid")

                await upsert_card(
                    session,
                    {
                        "game_code": "POKEMON",
                        "external_id": ext_id,
                        "name": card.get("name", "Unknown"),
                        "normalized_name": normalize_name(card.get("name", "")),
                        "set_code": set_info.get("id"),
                        "set_name": set_info.get("name"),
                        "card_number": card.get("number"),
                        "rarity": card.get("rarity"),
                        "card_type": (card.get("supertype") or "Pokemon"),
                        "game_specific_type": card.get("subtypes", [None])[0] if card.get("subtypes") else None,
                        "image_url": image,
                        "image_uris": {"normal": image} if image else {},
                        "source": "pokemontcg",
                        "external_ids": {"pokemontcg": ext_id},
                        "price_usd": price_usd,
                        "game_data": {
                            "hp": card.get("hp"),
                            "types": card.get("types"),
                            "subtypes": card.get("subtypes"),
                            "weaknesses": card.get("weaknesses"),
                            "retreat_cost": card.get("retreatCost"),
                            "abilities": card.get("abilities"),
                            "attacks": card.get("attacks"),
                            "rules": card.get("rules"),
                        },
                    },
                )
                count += 1
                batch = await maybe_commit_batch(session, batch + 1)

            page += 1
            if page > int(payload.get("totalCount", 0) // PAGE_SIZE + 1):
                break

    if batch:
        await session.commit()
    return {"status": "ok", "game": "POKEMON", "synced": count, "source": "pokemontcg"}
