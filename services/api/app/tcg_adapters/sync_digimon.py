"""Sync Digimon TCG (digimoncard.io) → card_catalog."""

from __future__ import annotations

from asyncio import sleep
from typing import Any

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.tcg_adapters.sync_common import maybe_commit_batch, normalize_name, upsert_card

DIGIMON_API = "https://digimoncard.io/api-public"
DIGIMON_SERIES = "Digimon Card Game"
DIGIMON_IMAGE = "https://images.digimoncard.io/images/cards/{card_id}.jpg"
BATCH_SIZE = 25


def _digimon_image(card_id: str) -> str:
    return DIGIMON_IMAGE.format(card_id=card_id)


def _set_label(card: dict[str, Any]) -> str | None:
    sets = card.get("set_name")
    if isinstance(sets, list) and sets:
        return str(sets[0])
    if isinstance(sets, str) and sets:
        return sets
    return card.get("setname")


async def _upsert_digimon_card(session: AsyncSession, card: dict[str, Any]) -> None:
    card_id = str(card.get("id") or card.get("cardnumber") or "").strip()
    if not card_id:
        return
    image = _digimon_image(card_id)
    set_name = _set_label(card)
    await upsert_card(
        session,
        {
            "game_code": "DIGIMON",
            "external_id": card_id,
            "name": card.get("name", "Unknown"),
            "normalized_name": normalize_name(card.get("name", "")),
            "set_code": card_id.split("-")[0] if "-" in card_id else None,
            "set_name": set_name,
            "card_number": card_id,
            "rarity": card.get("rarity"),
            "card_type": card.get("type"),
            "image_url": image,
            "image_uris": {"normal": image},
            "source": "digimoncard",
            "external_ids": {"digimoncard": card_id},
            "game_data": {
                "level": card.get("level"),
                "play_cost": card.get("play_cost"),
                "evolution_cost": card.get("evolution_cost"),
                "evolution_color": card.get("evolution_color"),
                "color": card.get("color"),
                "color2": card.get("color2"),
                "attribute": card.get("attribute"),
                "dp": card.get("dp"),
                "stage": card.get("stage"),
                "digi_type": card.get("digi_type"),
                "main_effect": card.get("main_effect"),
                "source_effect": card.get("source_effect"),
                "date_added": card.get("date_added"),
            },
        },
    )


async def _fetch_cards_by_ids(client: httpx.AsyncClient, card_ids: list[str]) -> list[dict[str, Any]]:
    if not card_ids:
        return []
    res = await client.get(
        f"{DIGIMON_API}/search",
        params={
            "series": DIGIMON_SERIES,
            "card": ",".join(card_ids),
        },
    )
    if not res.is_success:
        return []
    payload = res.json()
    if isinstance(payload, dict) and payload.get("error"):
        return []
    cards = payload if isinstance(payload, list) else payload.get("data") or []
    seen: set[str] = set()
    unique: list[dict[str, Any]] = []
    for card in cards:
        cid = str(card.get("id") or card.get("cardnumber") or "")
        if not cid or cid in seen:
            continue
        seen.add(cid)
        unique.append(card)
    return unique


async def _sync_digimon_recent(session: AsyncSession, *, limit: int) -> dict[str, Any]:
    """Sync parcial — cartas mais recentes (ideal para cron diário)."""
    count = 0
    batch = 0
    async with httpx.AsyncClient(timeout=90.0, follow_redirects=True) as client:
        res = await client.get(
            f"{DIGIMON_API}/search",
            params={
                "series": DIGIMON_SERIES,
                "sort": "new",
                "sortdirection": "desc",
                "limit": min(limit, 200),
            },
        )
        if not res.is_success:
            return {"status": "error", "message": f"HTTP {res.status_code}"}
        cards = res.json()
        if isinstance(cards, dict):
            if cards.get("error"):
                return {"status": "error", "message": str(cards.get("error"))}
            cards = cards.get("data") or []

        seen: set[str] = set()
        for card in cards:
            cid = str(card.get("id") or card.get("cardnumber") or "")
            if not cid or cid in seen:
                continue
            seen.add(cid)
            if count >= limit:
                break
            await _upsert_digimon_card(session, card)
            count += 1
            batch = await maybe_commit_batch(session, batch + 1)

    if batch:
        await session.commit()
    return {"status": "ok", "game": "DIGIMON", "synced": count, "source": "digimoncard", "mode": "recent"}


async def _sync_digimon_full(session: AsyncSession) -> dict[str, Any]:
    """Sync completo via getAllCards + lookup em lote."""
    count = 0
    batch = 0
    async with httpx.AsyncClient(timeout=120.0, follow_redirects=True) as client:
        res = await client.get(
            f"{DIGIMON_API}/getAllCards",
            params={
                "series": DIGIMON_SERIES,
                "sort": "code",
                "sortdirection": "asc",
            },
        )
        if not res.is_success:
            return {"status": "error", "message": f"HTTP {res.status_code}"}
        catalog = res.json()
        if not isinstance(catalog, list):
            return {"status": "error", "message": "Resposta getAllCards inválida"}

        card_ids: list[str] = []
        seen: set[str] = set()
        for row in catalog:
            cid = str(row.get("cardnumber") or row.get("id") or "").strip()
            if cid and cid not in seen:
                seen.add(cid)
                card_ids.append(cid)

        total_ids = len(card_ids)
        for i in range(0, total_ids, BATCH_SIZE):
            chunk = card_ids[i : i + BATCH_SIZE]
            cards = await _fetch_cards_by_ids(client, chunk)
            for card in cards:
                await _upsert_digimon_card(session, card)
                count += 1
                batch = await maybe_commit_batch(session, batch + 1)
            await sleep(0.8)

    if batch:
        await session.commit()
    return {
        "status": "ok",
        "game": "DIGIMON",
        "synced": count,
        "source": "digimoncard",
        "mode": "full",
        "catalog_ids": total_ids,
    }


async def sync_digimon(session: AsyncSession, *, limit: int | None = 100) -> dict[str, Any]:
    if limit is None:
        return await _sync_digimon_full(session)
    return await _sync_digimon_recent(session, limit=limit)
