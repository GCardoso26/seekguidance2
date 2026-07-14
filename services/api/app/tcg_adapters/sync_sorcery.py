"""Sync Sorcery: Contested Realms (Curiosa API) → card_catalog."""

from __future__ import annotations

from typing import Any

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.catalog.image_utils import sorcery_slug_to_image_url
from app.tcg_adapters.sync_common import maybe_commit_batch, normalize_name, slug_set_code, upsert_card, upsert_set

SORCERY_API = "https://api.sorcerytcg.com/api/cards"


def _sorcery_image(slug: str | None) -> str | None:
    return sorcery_slug_to_image_url(slug)


async def sync_sorcery(session: AsyncSession, *, limit: int | None = None) -> dict[str, Any]:
    count = 0
    batch = 0
    sets_synced = 0
    seen_sets: set[str] = set()

    async with httpx.AsyncClient(timeout=120.0) as client:
        res = await client.get(SORCERY_API)
        if not res.is_success:
            return {"status": "error", "message": f"HTTP {res.status_code}"}
        cards = res.json()
        if not isinstance(cards, list):
            return {"status": "error", "message": "Invalid Sorcery API response"}

        for card in cards:
            if limit is not None and count >= limit:
                break
            name = str(card.get("name") or "Unknown")
            elements = str(card.get("elements") or "")
            guardian = card.get("guardian") or {}
            meta = guardian if isinstance(guardian, dict) else {}

            for set_entry in card.get("sets") or []:
                if limit is not None and count >= limit:
                    break
                if not isinstance(set_entry, dict):
                    continue
                set_name = str(set_entry.get("name") or "Unknown")
                set_code = slug_set_code(set_name)
                if set_code not in seen_sets:
                    await upsert_set(
                        session,
                        game_code="SORCERY",
                        code=set_code,
                        name=set_name,
                        external_id=set_code,
                        release_date=(set_entry.get("releasedAt") or "")[:10] or None,
                    )
                    seen_sets.add(set_code)
                    sets_synced += 1

                set_meta = set_entry.get("metadata") or meta
                if not isinstance(set_meta, dict):
                    set_meta = meta

                for variant in set_entry.get("variants") or [{}]:
                    if limit is not None and count >= limit:
                        break
                    if not isinstance(variant, dict):
                        continue
                    slug = str(variant.get("slug") or "")
                    ext_id = slug or f"{set_code}-{name}-{count}"
                    image = _sorcery_image(slug)
                    rarity = set_meta.get("rarity") or meta.get("rarity")
                    card_type = set_meta.get("type") or meta.get("type")

                    await upsert_card(
                        session,
                        {
                            "game_code": "SORCERY",
                            "external_id": ext_id,
                            "name": name,
                            "normalized_name": normalize_name(name),
                            "set_code": set_code,
                            "set_name": set_name,
                            "card_number": slug,
                            "rarity": rarity,
                            "card_type": card_type,
                            "image_url": image,
                            "image_uris": {"normal": image} if image else {},
                            "source": "sorcerytcg",
                            "external_ids": {"sorcery": ext_id},
                            "is_reprint": len(card.get("sets") or []) > 1,
                            "game_data": {
                                "element": elements,
                                "elements": elements,
                                "sub_types": card.get("subTypes"),
                                "cost": set_meta.get("cost"),
                                "attack": set_meta.get("attack"),
                                "defence": set_meta.get("defence"),
                                "text": set_meta.get("rulesText"),
                                "thresholds": set_meta.get("thresholds"),
                                "finish": variant.get("finish"),
                                "artist": variant.get("artist"),
                                "product": variant.get("product"),
                            },
                        },
                    )
                    count += 1
                    batch = await maybe_commit_batch(session, batch + 1)

    if batch:
        await session.commit()
    return {
        "status": "ok",
        "game": "SORCERY",
        "synced": count,
        "sets_synced": sets_synced,
        "source": "sorcerytcg",
    }
