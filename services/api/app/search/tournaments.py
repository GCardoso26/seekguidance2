"""Busca e descoberta de torneios."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def search_tournaments(
    session: AsyncSession,
    *,
    query: str | None = None,
    games: list[str] | None = None,
    formats: list[str] | None = None,
    status: list[str] | None = None,
    city: str | None = None,
    country: str | None = None,
    free_only: bool = False,
    max_fee_cents: int | None = None,
    is_official: bool | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    sort_by: str = "date",
    limit: int = 20,
    offset: int = 0,
) -> list[dict[str, Any]]:
    clauses = ["t.status NOT IN ('draft', 'cancelled')"]
    params: dict[str, Any] = {"lim": limit, "off": offset}

    if query:
        clauses.append("(t.name ILIKE :q OR t.description ILIKE :q)")
        params["q"] = f"%{query}%"
    if games:
        clauses.append("t.game_code = ANY(:games)")
        params["games"] = [g.upper() for g in games]
    if formats:
        clauses.append("t.format_code = ANY(:formats)")
        params["formats"] = [f.upper() for f in formats]
    if status:
        clauses.append("t.status = ANY(:status)")
        params["status"] = status
    if city:
        clauses.append("t.city ILIKE :city")
        params["city"] = f"%{city}%"
    if country:
        clauses.append("t.country = :country")
        params["country"] = country.upper()
    if free_only:
        clauses.append("COALESCE(t.entry_fee_cents, 0) = 0")
    if max_fee_cents is not None:
        clauses.append("COALESCE(t.entry_fee_cents, 0) <= :maxfee")
        params["maxfee"] = max_fee_cents
    if is_official is not None:
        clauses.append("t.is_official = :official")
        params["official"] = is_official
    if date_from:
        clauses.append("t.starts_at >= :dfrom")
        params["dfrom"] = date_from
    if date_to:
        clauses.append("t.starts_at <= :dto")
        params["dto"] = date_to

    order = "t.starts_at ASC NULLS LAST"
    if sort_by == "popularity":
        order = "registered DESC"
    elif sort_by == "prize_pool":
        order = "t.prize_pool DESC NULLS LAST"

    sql = f"""
        SELECT t.*,
          (SELECT COUNT(*) FROM tcg_judge.tournament_participants tp WHERE tp.tournament_id = t.id) AS registered,
          pp.handle AS organizer_handle, pp.display_name AS organizer_name
        FROM tcg_judge.tournaments t
        LEFT JOIN tcg_judge.player_profiles pp ON pp.id = t.created_by
        WHERE {' AND '.join(clauses)}
        ORDER BY {order}
        LIMIT :lim OFFSET :off
    """
    rows = (await session.execute(text(sql), params)).mappings().all()
    return [dict(r) for r in rows]
