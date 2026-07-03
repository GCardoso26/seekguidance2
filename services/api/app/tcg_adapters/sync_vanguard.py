"""Sync Cardfight!! Vanguard (TCGCSV / TCGPlayer) → card_catalog."""

from __future__ import annotations

import os
from typing import Any

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.tcg_adapters.sync_common import maybe_commit_batch, normalize_name, upsert_card, upsert_set

TCGCSV_CATEGORY = 16
TCGCSV_BASE = "https://tcgcsv.com/tcgplayer"
TCGCSV_UA = "JudgeTCG/1.0 (catalog sync; contact@judgetcg.com.br)"
SEALED_KEYWORDS = ("booster box", "display", "starter deck", "trial deck", "deck set", "case")


def _headers() -> dict[str, str]:
    h = {"Accept": "application/json", "User-Agent": TCGCSV_UA}
    key = os.getenv("JUSTTCG_API_KEY", "").strip()
    if key:
        h["x-api-key"] = key
    return h


def _extended_map(product: dict[str, Any]) -> dict[str, str]:
    out: dict[str, str] = {}
    for row in product.get("extendedData") or []:
        if isinstance(row, dict):
            name = str(row.get("name") or row.get("displayName") or "").strip()
            value = str(row.get("value") or "").strip()
            if name and value:
                out[name] = value
    return out


def _is_single_card(product: dict[str, Any]) -> bool:
    ext = _extended_map(product)
    if "Number" not in ext:
        return False
    name = str(product.get("name") or "").lower()
    return not any(kw in name for kw in SEALED_KEYWORDS)


def _card_number(ext: dict[str, str]) -> str:
    raw = ext.get("Number", "")
    if "/" in raw:
        return raw.split("/", 1)[1].replace("EN", "").strip()
    return raw


def _set_code_from_number(ext: dict[str, str], fallback: str) -> str:
    raw = ext.get("Number", "")
    if "/" in raw:
        return raw.split("/", 1)[0].strip() or fallback
    return fallback


async def _fetch_json(client: httpx.AsyncClient, url: str) -> dict[str, Any] | list[Any]:
    res = await client.get(url)
    if not res.is_success:
        return {}
    payload = res.json()
    return payload if isinstance(payload, dict | list) else {}


async def sync_vanguard(session: AsyncSession, *, limit: int | None = None) -> dict[str, Any]:
    count = 0
    batch = 0
    sets_synced = 0
    seen_sets: set[str] = set()
    groups_processed = 0

    async with httpx.AsyncClient(timeout=120.0, headers=_headers()) as client:
        groups_payload = await _fetch_json(client, f"{TCGCSV_BASE}/{TCGCSV_CATEGORY}/groups")
        groups = groups_payload.get("results") if isinstance(groups_payload, dict) else []
        if not isinstance(groups, list):
            return {"status": "error", "game": "VANGUARD", "message": "TCGCSV groups unavailable"}

        for group in groups:
            if limit is not None and count >= limit:
                break
            if not isinstance(group, dict):
                continue

            group_id = group.get("groupId")
            set_code = str(group.get("abbreviation") or group_id or "UNK")
            set_name = str(group.get("name") or set_code)
            if not group_id:
                continue

            products_payload = await _fetch_json(
                client,
                f"{TCGCSV_BASE}/{TCGCSV_CATEGORY}/{group_id}/products",
            )
            products = products_payload.get("results") if isinstance(products_payload, dict) else []
            if not isinstance(products, list) or not products:
                continue

            singles = [p for p in products if isinstance(p, dict) and _is_single_card(p)]
            if not singles:
                continue

            groups_processed += 1
            if set_code not in seen_sets:
                await upsert_set(
                    session,
                    game_code="VANGUARD",
                    code=set_code,
                    name=set_name,
                    external_id=str(group_id),
                    release_date=group.get("publishedOn"),
                )
                seen_sets.add(set_code)
                sets_synced += 1

            for product in singles:
                if limit is not None and count >= limit:
                    break

                ext = _extended_map(product)
                name = str(product.get("cleanName") or product.get("name") or "Unknown")
                product_id = str(product.get("productId") or count)
                image = product.get("imageUrl") or product.get("image_url")
                card_set_code = _set_code_from_number(ext, set_code)

                await upsert_card(
                    session,
                    {
                        "game_code": "VANGUARD",
                        "external_id": product_id,
                        "name": name,
                        "normalized_name": normalize_name(name),
                        "set_code": card_set_code,
                        "set_name": set_name,
                        "card_number": _card_number(ext),
                        "rarity": ext.get("Rarity"),
                        "card_type": ext.get("Unit") or ext.get("Card Type"),
                        "image_url": image,
                        "image_uris": {"normal": image} if image else {},
                        "source": "tcgcsv",
                        "external_ids": {"tcgplayer": product_id},
                        "game_data": {
                            "clan": ext.get("Clan") or ext.get("Race"),
                            "nation": ext.get("Nation"),
                            "grade": ext.get("Grade"),
                            "trigger": ext.get("Trigger"),
                            "critical": ext.get("Critical"),
                            "power": ext.get("Power"),
                            "shield": ext.get("Shield"),
                            "text": ext.get("Description"),
                            "skill_icon": ext.get("Skill Icon"),
                            "number": ext.get("Number"),
                        },
                    },
                )
                count += 1
                batch = await maybe_commit_batch(session, batch + 1)

    if batch:
        await session.commit()

    if count == 0:
        return {
            "status": "error",
            "game": "VANGUARD",
            "message": "No Vanguard cards found via TCGCSV (JustTCG does not list this game)",
        }

    return {
        "status": "ok",
        "game": "VANGUARD",
        "synced": count,
        "sets_synced": sets_synced,
        "groups_processed": groups_processed,
        "source": "tcgcsv",
    }
