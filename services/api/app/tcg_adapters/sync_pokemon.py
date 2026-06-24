"""Sync TCGdex → card_catalog."""

from __future__ import annotations

from typing import Any

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.tcg_adapters.set_sources import fetch_pokemon_tcgdex_sets
from app.tcg_adapters.sync_common import (
    maybe_commit_batch,
    normalize_name,
    resolve_tcgdex_image,
    upsert_card,
    upsert_set,
)


async def sync_tcgdex(session: AsyncSession, *, max_sets: int | None = 3) -> dict[str, Any]:
    count = 0
    batch = 0
    sets_synced = 0
    async with httpx.AsyncClient(timeout=60.0) as client:
        sets_list = await fetch_pokemon_tcgdex_sets(client)

        for i, set_summary in enumerate(sets_list):
            if max_sets and i >= max_sets:
                break

            set_id = set_summary["code"]
            detail = await client.get(f"https://api.tcgdex.net/v2/en/sets/{set_id}")
            if detail.status_code != 200:
                continue
            set_data = detail.json()

            await upsert_set(
                session,
                game_code="POKEMON",
                code=set_id,
                name=set_data.get("name") or set_summary["name"],
                external_id=set_id,
                release_date=set_data.get("releaseDate") or set_summary.get("release_date"),
                card_count=(set_data.get("cardCount") or {}).get("total")
                or set_summary.get("card_count"),
                icon_url=set_data.get("logo"),
            )
            sets_synced += 1

            for card in set_data.get("cards", []):
                local_id = str(card.get("localId", ""))
                image_url = resolve_tcgdex_image(
                    card.get("image"),
                    set_id=set_id,
                    local_id=local_id,
                )
                image_uris = {"normal": image_url} if image_url else {}
                await upsert_card(
                    session,
                    {
                        "game_code": "POKEMON",
                        "external_id": card.get("id", f"{set_id}-{local_id or count}"),
                        "name": card.get("name", "Unknown"),
                        "normalized_name": normalize_name(card.get("name", "")),
                        "set_code": set_id,
                        "set_name": set_data.get("name"),
                        "card_number": local_id,
                        "rarity": card.get("rarity"),
                        "card_type": (card.get("category") or "Pokemon"),
                        "image_url": image_url,
                        "image_uris": image_uris,
                        "source": "tcgdex",
                        "external_ids": {"tcgdex": card.get("id")},
                        "game_data": {
                            "hp": card.get("hp"),
                            "types": card.get("types"),
                            "stage": card.get("stage"),
                        },
                    },
                )
                count += 1
                batch = await maybe_commit_batch(session, batch + 1)

    if batch:
        await session.commit()
    return {
        "status": "ok",
        "game": "POKEMON",
        "synced": count,
        "sets_synced": sets_synced,
        "source": "tcgdex",
    }
