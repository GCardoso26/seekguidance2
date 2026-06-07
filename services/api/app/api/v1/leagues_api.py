"""API CRUD de ligas."""

from __future__ import annotations

from datetime import date, datetime
from typing import Any

from app.api.deps import DbSession
from app.api.v1.tournament_system import _require_user
from app.leagues.scoring import get_league_standings
from app.leagues.store import (
    add_league_event,
    create_league,
    get_league,
    get_league_events,
    join_league,
    link_event_tournament,
    list_leagues,
)
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(tags=["leagues"])


class LeagueEventInput(BaseModel):
    name: str
    event_date: datetime | None = None
    eventDate: datetime | None = None
    points_multiplier: float = 1.0
    pointsMultiplier: float | None = None
    week_number: int | None = None


class LeagueCreateBody(BaseModel):
    name: str = Field(min_length=3, max_length=120)
    game_code: str
    format_code: str
    season_start: date | None = None
    season_end: date | None = None
    scoring_rules: dict[str, Any] | None = None
    prize_structure: dict[str, Any] | None = None
    events: list[LeagueEventInput] | None = None


class LeagueEventBody(BaseModel):
    name: str
    event_date: datetime | None = None
    points_multiplier: float = 1.0


class LinkTournamentBody(BaseModel):
    tournament_id: str


@router.post("/runtime/judge/leagues")
async def create_league_endpoint(
    session: DbSession,
    body: LeagueCreateBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    events = [e.model_dump() for e in (body.events or [])]
    return await create_league(
        session,
        user_id,
        name=body.name,
        game_code=body.game_code,
        format_code=body.format_code,
        season_start=body.season_start,
        season_end=body.season_end,
        scoring_rules=body.scoring_rules,
        prize_structure=body.prize_structure,
        events=events,
    )


@router.get("/runtime/judge/leagues")
async def list_leagues_endpoint(session: DbSession, status: str = "active") -> list[dict[str, Any]]:
    return await list_leagues(session, status=status)


@router.get("/runtime/judge/leagues/{league_id}")
async def get_league_endpoint(session: DbSession, league_id: str) -> dict[str, Any]:
    league = await get_league(session, league_id)
    if not league:
        raise HTTPException(404, "Liga não encontrada")
    events = await get_league_events(session, league_id)
    standings = await get_league_standings(session, league_id)
    return {"league": league, "events": events, "standings": standings}


@router.post("/runtime/judge/leagues/{league_id}/join")
async def join_league_endpoint(
    session: DbSession,
    league_id: str,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    user_id = _require_user(x_judge_user_id)
    return await join_league(session, league_id, user_id)


@router.get("/runtime/judge/leagues/{league_id}/standings")
async def standings_endpoint(session: DbSession, league_id: str) -> list[dict[str, Any]]:
    return await get_league_standings(session, league_id)


@router.post("/runtime/judge/leagues/{league_id}/events")
async def add_event_endpoint(
    session: DbSession,
    league_id: str,
    body: LeagueEventBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    _require_user(x_judge_user_id)
    return await add_league_event(
        session,
        league_id,
        name=body.name,
        event_date=body.event_date,
        points_multiplier=body.points_multiplier,
    )


@router.post("/runtime/judge/leagues/{league_id}/events/{event_id}/link-tournament")
async def link_tournament_endpoint(
    session: DbSession,
    league_id: str,
    event_id: str,
    body: LinkTournamentBody,
    x_judge_user_id: str | None = Header(default=None, alias="X-Judge-User-Id"),
) -> dict[str, Any]:
    _require_user(x_judge_user_id)
    return await link_event_tournament(session, league_id, event_id, body.tournament_id)
