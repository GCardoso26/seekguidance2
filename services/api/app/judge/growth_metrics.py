"""Métricas de crescimento do Judge (best-effort, Postgres)."""

from __future__ import annotations

import json
from datetime import UTC, datetime, timedelta
from typing import Any

import structlog
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

logger = structlog.get_logger(__name__)

GROWTH_EVENT_TYPES = frozenset(
    {
        "login",
        "share_created",
        "share_opened",
        "session_restored",
        "related_question_clicked",
        "history_opened",
        "judge_question_sent",
        "favorites_saved",
    }
)


async def record_growth_metric(
    session: AsyncSession,
    metric_type: str,
    *,
    game: str | None = None,
    metric_value: float | None = None,
    details: dict[str, Any] | None = None,
) -> None:
    if metric_type not in GROWTH_EVENT_TYPES:
        return
    try:
        await session.execute(
            text(
                """
                INSERT INTO tcg_judge.judge_growth_metrics
                  (game, metric_type, metric_value, details)
                VALUES (:game, :metric_type, :metric_value, CAST(:details AS jsonb))
                """
            ),
            {
                "game": game,
                "metric_type": metric_type,
                "metric_value": metric_value,
                "details": json.dumps(details or {}),
            },
        )
        await session.commit()
    except Exception:
        logger.warning("growth_metric_record_failed", metric_type=metric_type, exc_info=True)
        try:
            await session.rollback()
        except Exception:
            pass


async def growth_dashboard_payload(session: AsyncSession, days: int = 30) -> dict[str, Any]:
    since = datetime.now(UTC) - timedelta(days=max(1, min(days, 90)))
    try:
        rows = (
            await session.execute(
                text(
                    """
                    SELECT metric_type, game, COUNT(*)::int AS cnt
                    FROM tcg_judge.judge_growth_metrics
                    WHERE created_at >= :since
                    GROUP BY metric_type, game
                    """
                ),
                {"since": since},
            )
        ).mappings().all()
    except Exception:
        logger.warning("growth_dashboard_query_failed", exc_info=True)
        return _empty_growth_payload(days)

    by_type: dict[str, int] = {}
    by_game: dict[str, int] = {}
    for r in rows:
        mt = str(r["metric_type"])
        by_type[mt] = by_type.get(mt, 0) + int(r["cnt"])
        g = r.get("game")
        if g:
            by_game[str(g)] = by_game.get(str(g), 0) + int(r["cnt"])

    dau = await _distinct_days(session, since, 1)
    wau = await _distinct_days(session, since, 7)
    mau = await _distinct_days(session, since, 30)

    related_clicks = by_type.get("related_question_clicked", 0)
    questions_sent = by_type.get("judge_question_sent", 0)
    related_ctr = (related_clicks / questions_sent) if questions_sent else 0.0

    shares_created = by_type.get("share_created", 0)
    shares_opened = by_type.get("share_opened", 0)

    top_games = sorted(by_game.items(), key=lambda x: -x[1])[:10]

    return {
        "window_days": days,
        "dau": dau,
        "wau": wau,
        "mau": mau,
        "sessions_per_user": _ratio(by_type.get("session_restored", 0), max(dau, 1)),
        "questions_per_session": _ratio(questions_sent, max(by_type.get("session_restored", 1), 1)),
        "related_question_ctr": round(related_ctr, 4),
        "shares_created": shares_created,
        "shares_opened": shares_opened,
        "top_games": [{"game": g, "events": c} for g, c in top_games],
        "events_by_type": by_type,
    }


async def _distinct_days(session: AsyncSession, since: datetime, window_days: int) -> int:
    try:
        row = (
            await session.execute(
                text(
                    """
                    SELECT COUNT(DISTINCT date_trunc('day', created_at))::int AS active_days
                    FROM tcg_judge.judge_growth_metrics
                    WHERE created_at >= :since
                      AND metric_type IN ('judge_question_sent', 'login')
                    """
                ),
                {"since": since},
            )
        ).mappings().first()
        return int(row["active_days"] if row else 0)
    except Exception:
        return 0


def _ratio(num: int, den: int) -> float:
    return round(num / den, 2) if den else 0.0


def _empty_growth_payload(days: int) -> dict[str, Any]:
    return {
        "window_days": days,
        "dau": 0,
        "wau": 0,
        "mau": 0,
        "sessions_per_user": 0.0,
        "questions_per_session": 0.0,
        "related_question_ctr": 0.0,
        "shares_created": 0,
        "shares_opened": 0,
        "top_games": [],
        "events_by_type": {},
    }
