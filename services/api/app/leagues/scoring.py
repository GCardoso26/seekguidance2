"""Pontuação de ligas/temporadas."""

from __future__ import annotations

from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def update_league_standings_from_tournament(
    session: AsyncSession,
    league_id: str,
    tournament_id: str,
    points_by_player: dict[str, int],
    multiplier: float = 1.0,
) -> None:
    for player_id, base_pts in points_by_player.items():
        pts = int(base_pts * multiplier)
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.league_standings (league_id, player_id, total_points, events_played)
                VALUES (:lid, :pid, :pts, 1)
                ON CONFLICT (league_id, player_id) DO UPDATE SET
                  total_points = league_standings.total_points + :pts,
                  events_played = league_standings.events_played + 1,
                  updated_at = NOW()
                """
            ),
            {"lid": league_id, "pid": player_id, "pts": pts},
        )


async def get_league_standings(session: AsyncSession, league_id: str) -> list[dict[str, Any]]:
    rows = (
        await session.execute(
            text(
                """
                SELECT ls.*, p.handle, p.display_name,
                  ROW_NUMBER() OVER (ORDER BY ls.total_points DESC) AS rank
                FROM tcg_judge.league_standings ls
                JOIN tcg_judge.player_profiles p ON p.id = ls.player_id
                WHERE ls.league_id = :lid
                ORDER BY ls.total_points DESC
                """
            ),
            {"lid": league_id},
        )
    ).mappings().all()
    return [dict(r) for r in rows]
