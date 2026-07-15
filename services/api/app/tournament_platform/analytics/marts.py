"""Analytics mart readers — outside analytics_runtime package."""

from __future__ import annotations

from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


class AnalyticsMartService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def _one(self, sql: str, params: dict[str, Any]) -> dict[str, Any] | None:
        try:
            row = (await self.session.execute(text(sql), params)).mappings().first()
            return dict(row) if row else None
        except Exception:
            return None

    async def event_mart(self, store_event_id: str) -> dict[str, Any]:
        row = await self._one(
            """
            SELECT store_event_id::text, store_id::text, registered_count, checked_in_count,
                   revenue_cents, capacity, snapshot_at::text, factors
            FROM tcg_judge.mart_events WHERE store_event_id = CAST(:id AS uuid)
            """,
            {"id": store_event_id},
        )
        return row or {
            "store_event_id": store_event_id,
            "registered_count": 0,
            "checked_in_count": 0,
            "revenue_cents": 0,
            "source": "empty_mart",
        }

    async def tournament_mart(self, tournament_id: str) -> dict[str, Any]:
        row = await self._one(
            """
            SELECT tournament_id::text, store_event_id::text, status, current_round,
                   players_active, snapshot_at::text, factors
            FROM tcg_judge.mart_tournaments WHERE tournament_id = CAST(:id AS uuid)
            """,
            {"id": tournament_id},
        )
        return row or {"tournament_id": tournament_id, "source": "empty_mart"}

    async def health(self, tournament_id: str) -> dict[str, Any]:
        row = await self._one(
            """
            SELECT tournament_id::text, health_score, factors, snapshot_at::text
            FROM tcg_judge.mart_tournament_health WHERE tournament_id = CAST(:id AS uuid)
            """,
            {"id": tournament_id},
        )
        return row or {
            "tournament_id": tournament_id,
            "health_score": 50,
            "factors": {"baseline": True},
            "source": "heuristic_stub",
        }

    async def refresh_health_stub(self, tournament_id: str, score: int = 50) -> dict[str, Any]:
        try:
            await self.session.execute(
                text(
                    """
                    INSERT INTO tcg_judge.mart_tournament_health (tournament_id, health_score, factors)
                    VALUES (CAST(:id AS uuid), :score, '{"stub": true}'::jsonb)
                    ON CONFLICT (tournament_id) DO UPDATE
                      SET health_score = EXCLUDED.health_score, snapshot_at = NOW()
                    """
                ),
                {"id": tournament_id, "score": max(0, min(100, score))},
            )
            await self.session.commit()
        except Exception:
            pass
        return await self.health(tournament_id)
