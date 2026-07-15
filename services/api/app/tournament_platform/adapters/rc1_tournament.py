"""Project legacy tournaments into Tournament Platform shapes."""

from __future__ import annotations

from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def get_tournament_row(session: AsyncSession, tournament_id: str) -> dict[str, Any] | None:
    try:
        row = (
            await session.execute(
                text(
                    """
                    SELECT id::text AS id, name, status, phase, current_round,
                           created_by, store_id::text AS store_id,
                           store_event_id::text AS store_event_id,
                           game, format
                    FROM tcg_judge.tournaments
                    WHERE id = CAST(:id AS uuid)
                    LIMIT 1
                    """
                ),
                {"id": tournament_id},
            )
        ).mappings().first()
    except Exception:
        # Columns store_id / store_event_id may not exist pre-migration
        row = (
            await session.execute(
                text(
                    """
                    SELECT id::text AS id, name, status, phase, current_round,
                           created_by, NULL::text AS store_id,
                           NULL::text AS store_event_id
                    FROM tcg_judge.tournaments
                    WHERE id = CAST(:id AS uuid)
                    LIMIT 1
                    """
                ),
                {"id": tournament_id},
            )
        ).mappings().first()
    return dict(row) if row else None


async def list_tournaments_for_store(session: AsyncSession, store_id: str) -> list[dict[str, Any]]:
    try:
        rows = (
            await session.execute(
                text(
                    """
                    SELECT id::text AS id, name, status, phase, current_round,
                           store_event_id::text AS store_event_id
                    FROM tcg_judge.tournaments
                    WHERE store_id = CAST(:store_id AS uuid)
                    ORDER BY created_at DESC NULLS LAST
                    LIMIT 100
                    """
                ),
                {"store_id": store_id},
            )
        ).mappings().all()
        return [dict(r) for r in rows]
    except Exception:
        return []


async def list_participants_projection(
    session: AsyncSession, tournament_id: str
) -> list[dict[str, Any]]:
    try:
        rows = (
            await session.execute(
                text(
                    """
                    SELECT id::text AS id, user_id, display_name, status,
                           match_points, match_wins, match_losses, match_draws,
                           omw_percent, gw_percent, ogw_percent,
                           checked_in_at::text AS checked_in_at
                    FROM tcg_judge.tournament_participants
                    WHERE tournament_id = CAST(:tid AS uuid)
                    ORDER BY match_points DESC, omw_percent DESC
                    """
                ),
                {"tid": tournament_id},
            )
        ).mappings().all()
        return [dict(r) for r in rows]
    except Exception:
        return []
