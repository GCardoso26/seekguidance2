"""Versões/reprints de uma carta no catálogo."""

from __future__ import annotations

from typing import Any, Literal
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.catalog.image_utils import resolve_card_image


def _parse_uuid(card_id: str) -> UUID:
    try:
        return UUID(str(card_id))
    except ValueError as exc:
        raise HTTPException(404, "Carta não encontrada") from exc


async def get_card_versions(
    session: AsyncSession,
    card_id: str,
    *,
    foil_only: bool | None = None,
    in_stock: bool | None = None,
    sort: Literal[
        "release_date_desc", "release_date_asc", "price_asc", "price_desc"
    ] = "release_date_desc",
) -> dict[str, Any]:
    uid = _parse_uuid(card_id)

    base = (
        await session.execute(
            text(
                """
                SELECT id, name, normalized_name, game_code
                FROM tcg_judge.card_catalog
                WHERE id = :id
                """
            ),
            {"id": uid},
        )
    ).mappings().first()
    if not base:
        raise HTTPException(404, "Carta não encontrada")

    norm = base.get("normalized_name") or base["name"]
    game = base["game_code"]

    rows = (
        await session.execute(
            text(
                """
                SELECT
                  cc.id,
                  cc.set_code,
                  cc.set_name,
                  cc.card_number,
                  cc.rarity,
                  cc.image_url,
                  cc.image_uris,
                  cs.release_date,
                  COALESCE(lst.cnt, 0)::int AS listing_count,
                  COALESCE(lst.min_price, price.min_cents) AS lowest_cents,
                  COALESCE(lst.max_price, price.max_cents) AS highest_cents,
                  COALESCE(lst.foil_avail, false) AS foil_available,
                  COALESCE(lst.non_foil_avail, false) AS non_foil_available
                FROM tcg_judge.card_catalog cc
                LEFT JOIN tcg_judge.card_sets cs
                  ON cs.game_code = cc.game_code AND LOWER(cs.code) = LOWER(cc.set_code)
                LEFT JOIN LATERAL (
                  SELECT
                    COUNT(*)::int AS cnt,
                    MIN(cl.price_cents) AS min_price,
                    MAX(cl.price_cents) AS max_price,
                    BOOL_OR(cl.foil) AS foil_avail,
                    BOOL_OR(NOT cl.foil) AS non_foil_avail
                  FROM tcg_judge.card_listings cl
                  WHERE cl.card_id = cc.id
                    AND cl.status = 'active'
                    AND cl.quantity > 0
                ) lst ON TRUE
                LEFT JOIN LATERAL (
                  SELECT
                    MIN(cp.price_cents) AS min_cents,
                    MAX(cp.price_cents) AS max_cents
                  FROM tcg_judge.card_prices cp
                  WHERE cp.card_id = cc.id
                ) price ON TRUE
                WHERE cc.game_code = :game
                  AND cc.normalized_name = :norm
                """
            ),
            {"game": game, "norm": norm},
        )
    ).mappings().all()

    versions: list[dict[str, Any]] = []
    for row in rows:
        listing_count = int(row["listing_count"] or 0)
        if foil_only and not row.get("foil_available"):
            continue
        if in_stock and listing_count == 0:
            continue

        resolved = resolve_card_image(dict(row))
        image_url = resolved["normal"] or None

        low = row.get("lowest_cents")
        high = row.get("highest_cents")
        release = row.get("release_date")

        versions.append({
            "blueprint_id": abs(hash(str(row["id"]))) % 900_000_000 + 10_000,
            "expansion_id": abs(hash(str(row.get("set_code") or ""))) % 900_000,
            "expansion_name": str(row.get("set_name") or ""),
            "expansion_code": str(row.get("set_code") or ""),
            "expansion_release_date": release.isoformat() if release else None,
            "collector_number": str(row.get("card_number") or ""),
            "rarity": row.get("rarity"),
            "image_url": image_url or "",
            "available_items": listing_count,
            "lowest_price": {"cents": int(low), "currency": "BRL"} if low is not None else None,
            "highest_price": {"cents": int(high), "currency": "BRL"} if high is not None else None,
            "foil_available": bool(row.get("foil_available")),
            "non_foil_available": bool(row.get("non_foil_available")),
            "card_id": str(row["id"]),
        })

    sort_keys = {
        "release_date_desc": lambda x: x["expansion_release_date"] or "",
        "release_date_asc": lambda x: x["expansion_release_date"] or "",
        "price_asc": lambda x: (x["lowest_price"] or {}).get("cents", float("inf")),
        "price_desc": lambda x: (x["lowest_price"] or {}).get("cents", 0),
    }
    reverse = sort in ("release_date_desc", "price_desc")
    versions.sort(key=sort_keys.get(sort, sort_keys["release_date_desc"]), reverse=reverse)

    return {
        "card_id": card_id,
        "card_name": str(base["name"]),
        "versions": versions,
        "total_versions": len(versions),
        "total_items": sum(v["available_items"] for v in versions),
    }
