"""Marketplace de decklists."""

from __future__ import annotations

import json
from typing import Any

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

PLATFORM_FEE_PERCENT = 30


async def create_listing(
    session: AsyncSession,
    seller_id: str,
    *,
    name: str,
    game_code: str,
    format_code: str,
    decklist_data: dict[str, Any],
    price_cents: int,
    description: str | None = None,
    tournament_id: str | None = None,
    tags: list[str] | None = None,
) -> dict[str, Any]:
    if not 500 <= price_cents <= 5000:
        raise HTTPException(400, "Preço deve ser entre R$ 5 e R$ 50")
    row = (
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.marketplace_decklists (
                  seller_id, tournament_id, game_code, format, name, description,
                  decklist_data, price_cents, tags
                ) VALUES (
                  :sid, :tid, :gc, :fc, :name, :desc,
                  CAST(:deck AS jsonb), :price, :tags
                )
                RETURNING *
                """
            ),
            {
                "sid": seller_id,
                "tid": tournament_id,
                "gc": game_code.upper(),
                "fc": format_code.upper(),
                "name": name,
                "desc": description,
                "deck": json.dumps(decklist_data),
                "price": price_cents,
                "tags": tags or [],
            },
        )
    ).mappings().first()
    await session.commit()
    return dict(row) if row else {}


async def search_listings(
    session: AsyncSession,
    *,
    query: str | None = None,
    game: str | None = None,
    format_code: str | None = None,
    tag: str | None = None,
    limit: int = 20,
    offset: int = 0,
) -> list[dict[str, Any]]:
    clauses = ["md.status = 'active'"]
    params: dict[str, Any] = {"lim": limit, "off": offset}
    if query:
        clauses.append("(md.name ILIKE :q OR md.description ILIKE :q)")
        params["q"] = f"%{query}%"
    if game:
        clauses.append("md.game_code = :gc")
        params["gc"] = game.upper()
    if format_code:
        clauses.append("md.format = :fc")
        params["fc"] = format_code.upper()
    if tag:
        clauses.append(":tag = ANY(md.tags)")
        params["tag"] = tag.lower()
    sql = f"""
        SELECT md.*, p.handle AS seller_handle, p.display_name AS seller_name
        FROM tcg_judge.marketplace_decklists md
        JOIN tcg_judge.player_profiles p ON p.id = md.seller_id
        WHERE {' AND '.join(clauses)}
        ORDER BY md.average_rating DESC, md.sales_count DESC
        LIMIT :lim OFFSET :off
    """
    rows = (await session.execute(text(sql), params)).mappings().all()
    return [dict(r) for r in rows]


async def get_listing(session: AsyncSession, listing_id: str) -> dict[str, Any] | None:
    row = (
        await session.execute(
            text(
                """
                SELECT md.*, p.handle AS seller_handle, p.display_name AS seller_name
                FROM tcg_judge.marketplace_decklists md
                JOIN tcg_judge.player_profiles p ON p.id = md.seller_id
                WHERE md.id = :id
                """
            ),
            {"id": listing_id},
        )
    ).mappings().first()
    return dict(row) if row else None
