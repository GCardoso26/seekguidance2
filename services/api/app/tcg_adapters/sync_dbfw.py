"""Sync Dragon Ball Super: Fusion World (apitcg GitHub data) → card_catalog."""

from __future__ import annotations

from typing import Any

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.tcg_adapters.sync_common import maybe_commit_batch, normalize_name, upsert_card, upsert_set
from app.tcg_adapters.sync_github_apitcg import fetch_apitcg_repo_cards, resolve_apitcg_set

APITCG_REPO = "dragon-ball-fusion-tcg-data"


def _dbfw_image(card: dict[str, Any]) -> str | None:
    images = card.get("images") or {}
    if isinstance(images, dict):
        return images.get("large") or images.get("small")
    return None


async def sync_dbfw(session: AsyncSession, *, limit: int | None = None) -> dict[str, Any]:
    count = 0
    batch = 0
    sets_synced = 0
    seen_sets: set[str] = set()

    async with httpx.AsyncClient(timeout=120.0) as client:
        cards = await fetch_apitcg_repo_cards(client, APITCG_REPO)
        if not cards:
            return {"status": "error", "message": "No DB Fusion World cards from apitcg GitHub"}

        for card in cards:
            if limit is not None and count >= limit:
                break
            set_code, set_name = resolve_apitcg_set(card, default_code="FB")
            if set_code not in seen_sets:
                await upsert_set(
                    session,
                    game_code="DBFW",
                    code=set_code,
                    name=str(set_name),
                    external_id=set_code,
                )
                seen_sets.add(set_code)
                sets_synced += 1

            name = str(card.get("name") or "Unknown")
            ext_id = str(card.get("id") or card.get("code") or count)
            image = _dbfw_image(card)

            await upsert_card(
                session,
                {
                    "game_code": "DBFW",
                    "external_id": ext_id,
                    "name": name,
                    "normalized_name": normalize_name(name),
                    "set_code": set_code,
                    "set_name": str(set_name),
                    "card_number": str(card.get("code") or ""),
                    "rarity": card.get("rarity"),
                    "card_type": card.get("cardType"),
                    "image_url": image,
                    "image_uris": {"normal": image} if image else {},
                    "source": "apitcg",
                    "external_ids": {"apitcg": ext_id},
                    "game_data": {
                        "color": card.get("color"),
                        "cost": card.get("cost"),
                        "power": card.get("power"),
                        "combo_power": card.get("comboPower"),
                        "features": card.get("features"),
                        "effect": card.get("effect"),
                        "specified_cost": card.get("specifiedCost"),
                    },
                },
            )
            count += 1
            batch = await maybe_commit_batch(session, batch + 1)

    if batch:
        await session.commit()
    return {
        "status": "ok",
        "game": "DBFW",
        "synced": count,
        "sets_synced": sets_synced,
        "source": "apitcg-github",
    }
