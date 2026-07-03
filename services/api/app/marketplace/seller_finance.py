"""Financeiro do painel lojista — receitas, repasses, Stripe e PIX."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any, Literal

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.marketplace.seller_dashboard import resolve_owner_store

Period = Literal["7d", "30d", "90d", "custom"]
_PAID_STATUSES = ("paid", "processing", "shipped", "delivered")


def _period_start(period: Period, date_from: str | None) -> datetime:
    if date_from:
        return datetime.fromisoformat(date_from.replace("Z", "+00:00"))
    days = {"7d": 7, "30d": 30, "90d": 90}.get(period, 30)
    return datetime.now(UTC) - timedelta(days=days)


async def get_revenue_report(
    session: AsyncSession,
    owner_id: str,
    *,
    period: Period = "30d",
    date_from: str | None = None,
    date_to: str | None = None,
) -> dict[str, Any]:
    store = await resolve_owner_store(session, owner_id)
    store_id = str(store["id"])
    start = _period_start(period, date_from)

    params: dict[str, Any] = {"sid": store_id, "start": start}
    end_clause = ""
    if date_to:
        end_clause = " AND o.created_at <= CAST(:end AS timestamptz)"
        params["end"] = date_to

    rows = (
        await session.execute(
            text(
                f"""
                SELECT DATE(o.created_at) AS date,
                  COUNT(*)::int AS orders,
                  COALESCE(SUM(o.total_cents), 0)::bigint AS gross_cents,
                  COALESCE(SUM(o.platform_fee_cents), 0)::bigint AS fees_cents,
                  COALESCE(SUM(o.store_receives_cents), 0)::bigint AS net_cents
                FROM tcg_judge.shop_orders o
                WHERE o.store_id = :sid
                  AND o.status IN ('paid', 'processing', 'shipped', 'delivered')
                  AND o.created_at >= :start
                  {end_clause}
                GROUP BY DATE(o.created_at)
                ORDER BY date DESC
                """
            ),
            params,
        )
    ).mappings().all()

    chart = [
        {
            "date": str(r["date"]),
            "orders": int(r["orders"]),
            "gross_cents": int(r["gross_cents"]),
            "fees_cents": int(r["fees_cents"]),
            "net_cents": int(r["net_cents"]),
            "status": "received",
        }
        for r in rows
    ]

    totals = {
        "gross_cents": sum(c["gross_cents"] for c in chart),
        "fees_cents": sum(c["fees_cents"] for c in chart),
        "net_cents": sum(c["net_cents"] for c in chart),
        "orders": sum(c["orders"] for c in chart),
    }

    return {"rows": chart, "totals": totals, "period": period}


async def get_payouts_summary(session: AsyncSession, owner_id: str) -> dict[str, Any]:
    store = await resolve_owner_store(session, owner_id)
    store_id = str(store["id"])

    pending = (
        await session.execute(
            text(
                """
                SELECT COALESCE(SUM(store_receives_cents), 0)::bigint AS cents
                FROM tcg_judge.shop_orders
                WHERE store_id = :sid AND status = 'paid'
                  AND stripe_transfer_id IS NULL
                """
            ),
            {"sid": store_id},
        )
    ).mappings().first()

    completed = (
        await session.execute(
            text(
                """
                SELECT COALESCE(SUM(store_receives_cents), 0)::bigint AS cents,
                       COUNT(*)::int AS cnt
                FROM tcg_judge.shop_orders
                WHERE store_id = :sid AND stripe_transfer_id IS NOT NULL
                """
            ),
            {"sid": store_id},
        )
    ).mappings().first()

    return {
        "pending_cents": int(pending["cents"]) if pending else 0,
        "completed_cents": int(completed["cents"]) if completed else 0,
        "completed_count": int(completed["cnt"]) if completed else 0,
        "stripe_onboarding_complete": bool(store.get("stripe_onboarding_complete")),
        "stripe_account_id": store.get("stripe_account_id"),
    }


async def get_stripe_summary(session: AsyncSession, owner_id: str) -> dict[str, Any]:
    store = await resolve_owner_store(session, owner_id)
    store_id = str(store["id"])

    disputes = (
        await session.execute(
            text(
                """
                SELECT COUNT(*)::int AS cnt
                FROM tcg_judge.shop_orders
                WHERE store_id = :sid AND status = 'disputed'
                """
            ),
            {"sid": store_id},
        )
    ).mappings().first()

    stripe_orders = (
        await session.execute(
            text(
                """
                SELECT COUNT(*)::int AS cnt,
                       COALESCE(SUM(store_receives_cents), 0)::bigint AS cents
                FROM tcg_judge.shop_orders
                WHERE store_id = :sid
                  AND payment_method IN ('stripe', 'credit_card')
                  AND status IN ('paid', 'shipped', 'delivered')
                """
            ),
            {"sid": store_id},
        )
    ).mappings().first()

    return {
        "account_id": store.get("stripe_account_id"),
        "onboarding_complete": bool(store.get("stripe_onboarding_complete")),
        "open_disputes": int(disputes["cnt"]) if disputes else 0,
        "stripe_orders_count": int(stripe_orders["cnt"]) if stripe_orders else 0,
        "stripe_revenue_cents": int(stripe_orders["cents"]) if stripe_orders else 0,
    }


async def get_pix_summary(session: AsyncSession, owner_id: str) -> dict[str, Any]:
    store = await resolve_owner_store(session, owner_id)
    store_id = str(store["id"])

    row = (
        await session.execute(
            text(
                """
                SELECT
                  COUNT(*) FILTER (WHERE status = 'pending' AND payment_method = 'pix')::int AS pending,
                  COUNT(*) FILTER (
                    WHERE status IN ('paid','shipped','delivered') AND payment_method = 'pix'
                  )::int AS confirmed,
                  COALESCE(SUM(store_receives_cents) FILTER (
                    WHERE status IN ('paid','shipped','delivered') AND payment_method = 'pix'
                  ), 0)::bigint AS revenue_cents
                FROM tcg_judge.shop_orders
                WHERE store_id = :sid
                """
            ),
            {"sid": store_id},
        )
    ).mappings().first()

    return {
        "pix_key_configured": bool(store.get("pix_key")),
        "pending_count": int(row["pending"]) if row else 0,
        "confirmed_count": int(row["confirmed"]) if row else 0,
        "revenue_cents": int(row["revenue_cents"]) if row else 0,
    }


async def get_notification_settings(session: AsyncSession, owner_id: str) -> dict[str, Any]:
    store = await resolve_owner_store(session, owner_id)
    settings = store.get("notification_settings")
    if isinstance(settings, dict):
        return settings
    return {
        "new_order": ["email", "push"],
        "payment_received": ["email"],
        "ticket_created": ["email", "push"],
        "low_stock": ["email"],
        "daily_summary": ["email"],
    }


async def update_notification_settings(
    session: AsyncSession,
    owner_id: str,
    settings: dict[str, Any],
) -> dict[str, Any]:
    store = await resolve_owner_store(session, owner_id)
    store_id = str(store["id"])
    import json

    row = (
        await session.execute(
            text(
                """
                UPDATE tcg_judge.stores
                SET notification_settings = CAST(:settings AS jsonb), updated_at = NOW()
                WHERE id = :id AND owner_id = :oid
                RETURNING notification_settings
                """
            ),
            {"settings": json.dumps(settings), "id": store_id, "oid": owner_id},
        )
    ).mappings().first()
    if not row:
        raise HTTPException(404, "Loja não encontrada")
    await session.commit()
    return dict(row["notification_settings"]) if row.get("notification_settings") else settings
