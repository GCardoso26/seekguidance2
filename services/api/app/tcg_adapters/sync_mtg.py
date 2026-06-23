"""Sync Scryfall → card_catalog (bulk oracle cards)."""

from __future__ import annotations

from typing import Any

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.tcg_adapters.sync_common import maybe_commit_batch, normalize_name, upsert_card, upsert_set

SCRYFALL_BULK = "https://api.scryfall.com/bulk-data"
SCRYFALL_SETS = "https://api.scryfall.com/sets"
SCRYFALL_HEADERS = {"User-Agent": "JudgeTCG/1.0", "Accept": "application/json"}


def _image_uris(card: dict[str, Any]) -> dict[str, str]:
    uris = card.get("image_uris") or {}
    if uris:
        return {k: v for k, v in uris.items() if isinstance(v, str)}
    faces = card.get("card_faces") or []
    if faces and faces[0].get("image_uris"):
        return {k: v for k, v in faces[0]["image_uris"].items() if isinstance(v, str)}
    return {}


async def sync_scryfall_sets(session: AsyncSession) -> int:
    async with httpx.AsyncClient(timeout=60.0, headers=SCRYFALL_HEADERS) as client:
        res = await client.get(SCRYFALL_SETS)
        res.raise_for_status()
        sets = res.json().get("data", [])

    count = 0
    for s in sets:
        if s.get("set_type") in ("funny", "token", "memorabilia"):
            continue
        await upsert_set(
            session,
            game_code="MTG",
            code=s.get("code") or s.get("id"),
            name=s.get("name") or "Unknown",
            external_id=s.get("id"),
            release_date=s.get("released_at"),
            card_count=s.get("card_count"),
            icon_url=s.get("icon_svg_uri"),
        )
        count += 1
    await session.commit()
    return count


async def sync_scryfall(session: AsyncSession, *, limit: int | None = None) -> dict[str, Any]:
    sets_synced = await sync_scryfall_sets(session)

    async with httpx.AsyncClient(timeout=120.0, headers=SCRYFALL_HEADERS) as client:
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
    batch = 0
    for card in cards:
        if limit and count >= limit:
            break
        if card.get("layout") in ("token", "art_series", "double_faced_token"):
            continue

        legalities = {k.upper(): v for k, v in (card.get("legalities") or {}).items()}
        images = _image_uris(card)
        image = images.get("normal")
        prices = card.get("prices") or {}

        try:
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
                    "image_uris": images,
                    "language": card.get("lang") or "en",
                    "source": "scryfall",
                    "external_ids": {"scryfall": card["id"]},
                    "is_reprint": bool(card.get("reprint")),
                    "version": 1,
                    "price_usd": prices.get("usd"),
                    "foil": False,
                    "game_data": {
                        "mana_cost": card.get("mana_cost"),
                        "cmc": card.get("cmc"),
                        "type_line": card.get("type_line"),
                        "oracle_text": card.get("oracle_text"),
                        "colors": card.get("colors") or [],
                        "color_identity": card.get("color_identity") or [],
                        "power": card.get("power"),
                        "toughness": card.get("toughness"),
                        "loyalty": card.get("loyalty"),
                        "keywords": card.get("keywords") or [],
                        "legalities": legalities,
                        "edhrec_rank": card.get("edhrec_rank"),
                    },
                },
            )
            count += 1
            batch = await maybe_commit_batch(session, batch + 1)
        except Exception:
            await session.rollback()
            batch = 0

    if batch:
        await session.commit()
    return {"status": "ok", "game": "MTG", "synced": count, "sets_synced": sets_synced, "source": "scryfall"}
