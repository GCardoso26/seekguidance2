"""Métricas de negócio para dashboard admin."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def business_analytics(session: AsyncSession, *, period: str = "30d") -> dict[str, Any]:
    days = 7 if period == "7d" else 90 if period == "90d" else 30
    since = datetime.now(UTC) - timedelta(days=days)
    since_day = since.date()

    dau = (
        await session.execute(
            text(
                """
                SELECT COUNT(DISTINCT js.auth_user_id) AS c
                FROM tcg_judge.judge_sessions js
                WHERE js.created_at >= :since
                """
            ),
            {"since": since},
        )
    ).mappings().first()

    mau = (
        await session.execute(
            text(
                """
                SELECT COUNT(DISTINCT js.auth_user_id) AS c
                FROM tcg_judge.judge_sessions js
                WHERE js.created_at >= :since
                """
            ),
            {"since": since},
        )
    ).mappings().first()

    total_users = (
        await session.execute(text("SELECT COUNT(*) AS c FROM tcg_judge.player_profiles"))
    ).mappings().first()

    pro_active = (
        await session.execute(
            text(
                """
                SELECT COUNT(*) AS c FROM tcg_judge.subscriptions
                WHERE tier IN ('spike', 'team') AND status IN ('active', 'trialing')
                """
            )
        )
    ).mappings().first()

    cancelled = (
        await session.execute(
            text(
                """
                SELECT COUNT(*) AS c FROM tcg_judge.subscriptions
                WHERE status IN ('canceled', 'unpaid')
                  AND updated_at >= :since
                """
            ),
            {"since": since},
        )
    ).mappings().first()

    ltv = (
        await session.execute(
            text(
                """
                SELECT COALESCE(AVG(amount_paid), 0) AS avg_cents,
                       COALESCE(SUM(amount_paid), 0) AS total_cents
                FROM tcg_judge.invoices
                WHERE status = 'paid' AND amount_paid > 0
                """
            )
        )
    ).mappings().first()

    top_tcgs = (
        await session.execute(
            text(
                """
                SELECT js.tcg AS tcg, COUNT(*) AS consultations
                FROM tcg_judge.judge_session_messages jsm
                JOIN tcg_judge.judge_sessions js ON js.id = jsm.session_id
                WHERE jsm.role = 'user' AND jsm.created_at >= :since
                GROUP BY js.tcg
                ORDER BY consultations DESC
                LIMIT 8
                """
            ),
            {"since": since},
        )
    ).mappings().all()

    peak_hours = (
        await session.execute(
            text(
                """
                SELECT EXTRACT(HOUR FROM jsm.created_at AT TIME ZONE 'America/Sao_Paulo')::int AS hour,
                       COUNT(*) AS c
                FROM tcg_judge.judge_session_messages jsm
                WHERE jsm.role = 'user' AND jsm.created_at >= :since
                GROUP BY 1
                ORDER BY hour
                """
            ),
            {"since": since},
        )
    ).mappings().all()

    checkout_started = (
        await session.execute(
            text(
                """
                SELECT COUNT(*) AS c FROM tcg_judge.analytics_events
                WHERE event = 'checkout_started' AND timestamp >= :since
                """
            ),
            {"since": since},
        )
    ).mappings().first()

    checkout_completed = (
        await session.execute(
            text(
                """
                SELECT COUNT(*) AS c FROM tcg_judge.analytics_events
                WHERE event = 'checkout_completed' AND timestamp >= :since
                """
            ),
            {"since": since},
        )
    ).mappings().first()

    total_u = int(total_users["c"] or 0) if total_users else 0
    pro_c = int(pro_active["c"] or 0) if pro_active else 0
    conv_rate = round((pro_c / total_u) * 100, 2) if total_u > 0 else 0.0
    churn_base = pro_c + int(cancelled["c"] or 0) if cancelled else pro_c
    churn_rate = round((int(cancelled["c"] or 0) / churn_base) * 100, 2) if churn_base > 0 else 0.0
    started = int(checkout_started["c"] or 0) if checkout_started else 0
    completed = int(checkout_completed["c"] or 0) if checkout_completed else 0
    funnel_conv = round((completed / started) * 100, 2) if started > 0 else 0.0

    alerts: list[str] = []
    if churn_rate > 10:
        alerts.append(f"Churn acima de 10% ({churn_rate}%)")
    if conv_rate < 2 and total_u > 50:
        alerts.append(f"Conversão Free→Pro abaixo de 2% ({conv_rate}%)")

    return {
        "period": period,
        "periodDays": days,
        "dau": int(dau["c"] or 0) if dau else 0,
        "mau": int(mau["c"] or 0) if mau else 0,
        "totalUsers": total_u,
        "proSubscribers": pro_c,
        "conversionRatePercent": conv_rate,
        "churnRatePercent": churn_rate,
        "ltvAverageBrl": round(int(ltv["avg_cents"] or 0) / 100, 2) if ltv else 0,
        "ltvTotalBrl": round(int(ltv["total_cents"] or 0) / 100, 2) if ltv else 0,
        "topTcgs": [{"tcg": r["tcg"], "count": int(r["consultations"])} for r in top_tcgs],
        "peakHours": [{"hour": int(r["hour"]), "count": int(r["c"])} for r in peak_hours],
        "funnel": {
            "checkoutStarted": started,
            "checkoutCompleted": completed,
            "conversionPercent": funnel_conv,
        },
        "alerts": alerts,
    }
