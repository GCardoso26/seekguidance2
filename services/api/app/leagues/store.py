"""CRUD de ligas/temporadas."""

from __future__ import annotations

import json
from datetime import date, datetime
from typing import Any

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def create_league(
    session: AsyncSession,
    organizer_id: str,
    *,
    name: str,
    game_code: str,
    format_code: str,
    season_start: date | None = None,
    season_end: date | None = None,
    scoring_rules: dict | None = None,
    prize_structure: dict | None = None,
    events: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    row = (
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.leagues (
                  name, game_code, format, organizer_id,
                  season_start, season_end, scoring_rules, prize_structure, status
                ) VALUES (
                  :name, :gc, :fc, :oid,
                  :start, :end, CAST(:scoring AS jsonb), CAST(:prizes AS jsonb), 'active'
                )
                RETURNING *
                """
            ),
            {
                "name": name,
                "gc": game_code.upper(),
                "fc": format_code.upper(),
                "oid": organizer_id,
                "start": season_start,
                "end": season_end,
                "scoring": json.dumps(scoring_rules or {}),
                "prizes": json.dumps(prize_structure or {}),
            },
        )
    ).mappings().first()
    league = dict(row) if row else {}
    lid = str(league["id"])

    for i, ev in enumerate(events or []):
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.league_events (
                  league_id, name, event_date, points_multiplier, week_number
                ) VALUES (:lid, :name, :dt, :mult, :week)
                """
            ),
            {
                "lid": lid,
                "name": ev.get("name", f"Semana {i + 1}"),
                "dt": ev.get("event_date") or ev.get("eventDate"),
                "mult": ev.get("points_multiplier") or ev.get("pointsMultiplier", 1.0),
                "week": ev.get("week_number", i + 1),
            },
        )

    await session.commit()
    return league


async def list_leagues(
    session: AsyncSession,
    *,
    status: str = "active",
    limit: int = 20,
) -> list[dict[str, Any]]:
    rows = (
        await session.execute(
            text(
                """
                SELECT l.*, p.handle AS organizer_handle,
                  (SELECT COUNT(*) FROM tcg_judge.league_participants lp WHERE lp.league_id = l.id) AS participants
                FROM tcg_judge.leagues l
                JOIN tcg_judge.player_profiles p ON p.id = l.organizer_id
                WHERE l.status = :st
                ORDER BY l.created_at DESC
                LIMIT :lim
                """
            ),
            {"st": status, "lim": limit},
        )
    ).mappings().all()
    return [dict(r) for r in rows]


async def get_league(session: AsyncSession, league_id: str) -> dict[str, Any] | None:
    row = (
        await session.execute(
            text("SELECT * FROM tcg_judge.leagues WHERE id = :id"),
            {"id": league_id},
        )
    ).mappings().first()
    return dict(row) if row else None


async def get_league_events(session: AsyncSession, league_id: str) -> list[dict[str, Any]]:
    rows = (
        await session.execute(
            text(
                """
                SELECT * FROM tcg_judge.league_events
                WHERE league_id = :lid ORDER BY week_number NULLS LAST, event_date
                """
            ),
            {"lid": league_id},
        )
    ).mappings().all()
    return [dict(r) for r in rows]


async def join_league(session: AsyncSession, league_id: str, player_id: str) -> dict[str, Any]:
    league = await get_league(session, league_id)
    if not league:
        raise HTTPException(404, "Liga não encontrada")
    await session.execute(
        text(
            """
            INSERT INTO tcg_judge.league_participants (league_id, player_id)
            VALUES (:lid, :pid) ON CONFLICT DO NOTHING
            """
        ),
        {"lid": league_id, "pid": player_id},
    )
    await session.execute(
        text(
            """
            INSERT INTO tcg_judge.league_standings (league_id, player_id)
            VALUES (:lid, :pid) ON CONFLICT DO NOTHING
            """
        ),
        {"lid": league_id, "pid": player_id},
    )
    await session.commit()
    return {"leagueId": league_id, "playerId": player_id, "joined": True}


async def add_league_event(
    session: AsyncSession,
    league_id: str,
    *,
    name: str,
    event_date: datetime | None = None,
    points_multiplier: float = 1.0,
) -> dict[str, Any]:
    row = (
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.league_events (league_id, name, event_date, points_multiplier)
                VALUES (:lid, :name, :dt, :mult)
                RETURNING *
                """
            ),
            {"lid": league_id, "name": name, "dt": event_date, "mult": points_multiplier},
        )
    ).mappings().first()
    await session.commit()
    return dict(row) if row else {}


async def link_event_tournament(
    session: AsyncSession,
    league_id: str,
    event_id: str,
    tournament_id: str,
) -> dict[str, Any]:
    row = (
        await session.execute(
            text(
                """
                UPDATE tcg_judge.league_events SET tournament_id = :tid
                WHERE id = :eid AND league_id = :lid
                RETURNING *
                """
            ),
            {"tid": tournament_id, "eid": event_id, "lid": league_id},
        )
    ).mappings().first()
    if not row:
        raise HTTPException(404, "Evento não encontrado")
    await session.commit()
    return dict(row)
