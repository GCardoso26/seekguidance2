"""Dashboard administrativo."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def platform_stats(session: AsyncSession, *, days: int = 30) -> dict[str, Any]:
    since = datetime.now(UTC) - timedelta(days=days)

    users = (
        await session.execute(text("SELECT COUNT(*) AS c FROM tcg_judge.player_profiles"))
    ).mappings().first()

    tournaments = (
        await session.execute(
            text(
                """
                SELECT COUNT(*) AS c FROM tcg_judge.tournaments
                WHERE created_at >= :since
                """
            ),
            {"since": since},
        )
    ).mappings().first()

    revenue = (
        await session.execute(
            text(
                """
                SELECT COALESCE(SUM(amount_cents + platform_fee_cents), 0) AS c
                FROM tcg_judge.tournament_payments
                WHERE status = 'paid' AND paid_at >= :since
                """
            ),
            {"since": since},
        )
    ).mappings().first()

    disputes = (
        await session.execute(
            text(
                """
                SELECT COUNT(*) AS c FROM tcg_judge.pairings
                WHERE status = 'disputed' AND updated_at >= :since
                """
            ),
            {"since": since},
        )
    ).mappings().first()

    recent_users = (
        await session.execute(
            text(
                """
                SELECT id, handle, display_name, created_at
                FROM tcg_judge.player_profiles
                ORDER BY created_at DESC LIMIT 10
                """
            )
        )
    ).mappings().all()

    active_tournaments = (
        await session.execute(
            text(
                """
                SELECT id, name, status, game_code, starts_at
                FROM tcg_judge.tournaments
                WHERE status NOT IN ('finalized', 'cancelled', 'draft')
                ORDER BY starts_at NULLS LAST LIMIT 10
                """
            )
        )
    ).mappings().all()

    return {
        "periodDays": days,
        "totalUsers": int(users["c"] or 0) if users else 0,
        "tournaments30d": int(tournaments["c"] or 0) if tournaments else 0,
        "revenueCents30d": int(revenue["c"] or 0) if revenue else 0,
        "disputes30d": int(disputes["c"] or 0) if disputes else 0,
        "recentUsers": [dict(r) for r in recent_users],
        "activeTournaments": [dict(r) for r in active_tournaments],
    }
