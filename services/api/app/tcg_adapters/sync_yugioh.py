"""Sync YGOPRODeck → card_catalog."""

from __future__ import annotations

import re
from typing import Any

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.tcg_adapters.sync_common import maybe_commit_batch, normalize_name, upsert_card, upsert_set

YGOPRODECK_CARDS = "https://db.ygoprodeck.com/api/v7/cardinfo.php"
YGOPRODECK_CARDSETS = "https://db.ygoprodeck.com/api/v7/cardsets.php"

# YGOPRODeck `card_sets[].set_code` is usually the collector number (MAMO-EN015),
# while `cardsets.php` registry codes are bare (MAMO). Filters join on bare codes.
_YGO_PRINTING_RE = re.compile(r"^([A-Za-z0-9]+)-(.+)$")


def parse_ygo_set_printing(raw: str | None) -> tuple[str | None, str | None]:
    """Return (set_code, collector_number) from a YGOPRODeck printing code."""
    if raw is None:
        return None, None
    text = str(raw).strip()
    if not text:
        return None, None
    match = _YGO_PRINTING_RE.match(text)
    if match:
        return match.group(1).upper(), text
    return text.upper(), text


def _prefer_set_entry(
    card_sets: list[dict[str, Any]],
    *,
    prefer_set_code: str | None = None,
) -> dict[str, Any]:
    if not card_sets:
        return {}
    if prefer_set_code:
        want = prefer_set_code.upper()
        for entry in card_sets:
            parsed, _ = parse_ygo_set_printing(str(entry.get("set_code") or ""))
            if parsed == want:
                return entry
    return card_sets[0]


async def _upsert_yugioh_card(
    session: AsyncSession,
    card: dict[str, Any],
    *,
    prefer_set_code: str | None = None,
) -> None:
    card_sets = [s for s in (card.get("card_sets") or []) if isinstance(s, dict)]
    primary_set = _prefer_set_entry(card_sets, prefer_set_code=prefer_set_code)
    images = card.get("card_images") or [{}]
    image = images[0].get("image_url") if images else None
    card_id = str(card.get("id", ""))
    set_code, collector_number = parse_ygo_set_printing(primary_set.get("set_code"))

    await upsert_card(
        session,
        {
            "game_code": "YGO",
            "external_id": card_id,
            "name": card.get("name", "Unknown"),
            "normalized_name": normalize_name(card.get("name", "")),
            "set_code": set_code,
            "set_name": primary_set.get("set_name"),
            "card_number": collector_number or primary_set.get("set_rarity_code"),
            "rarity": primary_set.get("set_rarity"),
            "card_type": card.get("type"),
            "game_specific_type": card.get("frameType"),
            "image_url": image,
            "image_uris": {"normal": image} if image else {},
            "language": "en",
            "source": "ygoprodeck",
            "external_ids": {"ygoprodeck": card_id},
            "game_data": {
                "desc": card.get("desc"),
                "atk": card.get("atk"),
                "def": card.get("def"),
                "level": card.get("level"),
                "attribute": card.get("attribute"),
                "race": card.get("race"),
                "archetype": card.get("archetype"),
                "linkval": card.get("linkval"),
                "linkmarkers": card.get("linkmarkers"),
                "card_sets": card.get("card_sets") or [],
            },
        },
    )


async def _sync_yugioh_sets(session: AsyncSession, client: httpx.AsyncClient) -> int:
    res = await client.get(YGOPRODECK_CARDSETS)
    if not res.is_success:
        return 0
    rows = res.json()
    if not isinstance(rows, list):
        return 0
    synced = 0
    for row in rows:
        code = str(row.get("set_code") or "").strip()
        if not code:
            continue
        await upsert_set(
            session,
            game_code="YGO",
            code=code,
            name=str(row.get("set_name") or code),
            external_id=code,
            release_date=row.get("tcg_date"),
            card_count=row.get("num_of_cards"),
            icon_url=row.get("set_image"),
        )
        synced += 1
    await session.commit()
    return synced


async def _sync_yugioh_paginated(session: AsyncSession, *, limit: int) -> dict[str, Any]:
    count = 0
    batch = 0
    offset = 0
    page_size = min(100, limit)
    async with httpx.AsyncClient(timeout=60.0) as client:
        sets_synced = await _sync_yugioh_sets(session, client)
        while count < limit:
            res = await client.get(
                YGOPRODECK_CARDS,
                params={"num": page_size, "offset": offset},
            )
            if res.status_code == 400:
                break
            res.raise_for_status()
            cards = res.json().get("data") or []
            if not cards:
                break
            for card in cards:
                if count >= limit:
                    break
                await _upsert_yugioh_card(session, card)
                count += 1
                batch = await maybe_commit_batch(session, batch + 1)
            if len(cards) < page_size:
                break
            offset += page_size

    if batch:
        await session.commit()
    return {
        "status": "ok",
        "game": "YGO",
        "synced": count,
        "sets_synced": sets_synced,
        "source": "ygoprodeck",
        "mode": "paginated",
    }


async def sync_yugioh_cardset(
    session: AsyncSession,
    *,
    cardset: str,
    prefer_set_code: str | None = None,
) -> dict[str, Any]:
    """Sync a single named YGOPRODeck card set (e.g. Magnificent Monsters)."""
    count = 0
    batch = 0
    async with httpx.AsyncClient(timeout=120.0) as client:
        sets_synced = await _sync_yugioh_sets(session, client)
        res = await client.get(YGOPRODECK_CARDS, params={"cardset": cardset})
        res.raise_for_status()
        cards = res.json().get("data") or []

    for card in cards:
        await _upsert_yugioh_card(session, card, prefer_set_code=prefer_set_code)
        count += 1
        batch = await maybe_commit_batch(session, batch + 1)

    if batch:
        await session.commit()
    return {
        "status": "ok",
        "game": "YGO",
        "synced": count,
        "sets_synced": sets_synced,
        "source": "ygoprodeck",
        "mode": "cardset",
        "cardset": cardset,
        "prefer_set_code": prefer_set_code,
    }


async def sync_yugioh(session: AsyncSession, *, limit: int | None = None) -> dict[str, Any]:
    if limit is not None:
        return await _sync_yugioh_paginated(session, limit=limit)

    count = 0
    batch = 0
    sets_synced = 0
    async with httpx.AsyncClient(timeout=120.0) as client:
        sets_synced = await _sync_yugioh_sets(session, client)
        res = await client.get(YGOPRODECK_CARDS)
        res.raise_for_status()
        cards = res.json().get("data") or []

    for card in cards:
        await _upsert_yugioh_card(session, card)
        count += 1
        batch = await maybe_commit_batch(session, batch + 1)

    if batch:
        await session.commit()
    return {
        "status": "ok",
        "game": "YGO",
        "synced": count,
        "sets_synced": sets_synced,
        "source": "ygoprodeck",
        "mode": "bulk",
    }
