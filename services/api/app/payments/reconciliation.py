"""Payment reconciliation — compara Payment vs shop_orders vs ledger."""

from __future__ import annotations

from typing import Any, Literal

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.marketplace.seller_dashboard import resolve_owner_store

Period = Literal["7d", "30d", "90d"]


async def reconcile_store_payments(
    session: AsyncSession,
    store_id: str,
    *,
    limit: int = 100,
) -> dict[str, Any]:
    """Detecta divergências entre aggregate Payment e pedido legacy."""
    rows = (
        await session.execute(
            text(
                """
                SELECT
                  p.id AS payment_id,
                  p.shop_order_id,
                  p.status AS payment_status,
                  p.amount_cents AS payment_amount,
                  p.store_amount_cents,
                  p.stripe_payment_intent_id,
                  o.status AS order_status,
                  o.total_cents AS order_amount,
                  o.stripe_transfer_id,
                  CASE
                    WHEN o.id IS NULL THEN 'missing_order'
                    WHEN p.status = 'Approved' AND o.status = 'pending' THEN 'order_not_paid'
                    WHEN p.amount_cents != o.total_cents THEN 'amount_mismatch'
                    WHEN p.status IN ('Chargeback', 'Disputed') AND o.status != 'disputed' THEN 'dispute_mismatch'
                    WHEN p.status = 'Approved' AND o.stripe_transfer_id IS NULL
                         AND p.use_escrow = false AND p.payment_method IN ('stripe', 'credit_card')
                      THEN 'transfer_pending'
                    ELSE 'ok'
                  END AS reconciliation_status
                FROM tcg_judge.payments p
                LEFT JOIN tcg_judge.shop_orders o ON o.id = p.shop_order_id
                WHERE p.store_id = CAST(:sid AS uuid)
                ORDER BY p.created_at DESC
                LIMIT :lim
                """
            ),
            {"sid": store_id, "lim": limit},
        )
    ).mappings().all()

    items = [dict(r) for r in rows]
    issues = [i for i in items if i["reconciliation_status"] != "ok"]
    return {
        "items": items,
        "total": len(items),
        "issues_count": len(issues),
        "issues": issues,
        "healthy": len(issues) == 0,
    }


async def reconcile_single_payment(
    session: AsyncSession,
    *,
    payment_id: str,
) -> dict[str, Any]:
    row = (
        await session.execute(
            text(
                """
                SELECT p.id, p.shop_order_id, p.status, p.store_id
                FROM tcg_judge.payments p WHERE id = CAST(:pid AS uuid)
                """
            ),
            {"pid": payment_id},
        )
    ).mappings().first()
    if not row:
        return {"status": "not_found"}

    store_id = str(row["store_id"])
    report = await reconcile_store_payments(session, store_id, limit=500)
    matched = next((i for i in report["items"] if str(i["payment_id"]) == payment_id), None)
    if matched and matched["reconciliation_status"] == "order_not_paid":
        await session.execute(
            text(
                """
                UPDATE tcg_judge.shop_orders
                SET status = 'paid', updated_at = NOW()
                WHERE id = CAST(:oid AS uuid) AND status = 'pending'
                """
            ),
            {"oid": str(row["shop_order_id"])},
        )
        matched["reconciliation_status"] = "auto_fixed_order"
    return {"payment_id": payment_id, "result": matched or {"reconciliation_status": "ok"}}


async def get_reconciliation_report(
    session: AsyncSession,
    owner_id: str,
    *,
    limit: int = 100,
) -> dict[str, Any]:
    store = await resolve_owner_store(session, owner_id)
    return await reconcile_store_payments(session, str(store["id"]), limit=limit)


async def get_chargebacks_list(
    session: AsyncSession,
    owner_id: str,
    *,
    status: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> dict[str, Any]:
    store = await resolve_owner_store(session, owner_id)
    store_id = str(store["id"])
    status_clause = ""
    params: dict[str, Any] = {"sid": store_id, "lim": limit, "off": offset}
    if status:
        status_clause = " AND cb.status = :status"
        params["status"] = status

    rows = (
        await session.execute(
            text(
                f"""
                SELECT cb.id, cb.payment_id, cb.shop_order_id, cb.stripe_dispute_id,
                       cb.status, cb.amount_cents, cb.reason, cb.evidence_due_by,
                       cb.opened_at, cb.resolved_at, cb.created_at,
                       p.payment_method, p.stripe_payment_intent_id
                FROM tcg_judge.chargebacks cb
                JOIN tcg_judge.payments p ON p.id = cb.payment_id
                WHERE cb.store_id = CAST(:sid AS uuid)
                {status_clause}
                ORDER BY cb.opened_at DESC
                LIMIT :lim OFFSET :off
                """
            ),
            params,
        )
    ).mappings().all()

    open_count = (
        await session.execute(
            text(
                """
                SELECT COUNT(*)::int AS cnt FROM tcg_judge.chargebacks
                WHERE store_id = CAST(:sid AS uuid) AND status IN ('opened', 'under_review')
                """
            ),
            {"sid": store_id},
        )
    ).mappings().first()

    return {
        "items": [dict(r) for r in rows],
        "open_count": int(open_count["cnt"]) if open_count else 0,
    }


async def get_audit_trail(
    session: AsyncSession,
    owner_id: str,
    *,
    limit: int = 50,
    offset: int = 0,
) -> dict[str, Any]:
    from app.payments.payment_aggregate import get_payment_audit_trail

    store = await resolve_owner_store(session, owner_id)
    events = await get_payment_audit_trail(
        session, str(store["id"]), limit=limit, offset=offset
    )
    return {"events": events, "total": len(events)}
