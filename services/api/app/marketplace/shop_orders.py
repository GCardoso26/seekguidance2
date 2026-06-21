"""Pedidos e fulfillment do marketplace."""

from __future__ import annotations

import json
from typing import Any

import structlog
from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

import stripe
from app.core.config import Settings
from app.marketplace import shop_cart
from app.marketplace.shop_notifications import notify_shop_event

logger = structlog.get_logger(__name__)


async def list_buyer_orders(session: AsyncSession, buyer_id: str, limit: int = 20) -> list[dict[str, Any]]:
    rows = (
        await session.execute(
            text(
                """
                SELECT o.*, s.name AS store_name, s.slug AS store_slug
                FROM tcg_judge.shop_orders o
                JOIN tcg_judge.stores s ON s.id = o.store_id
                WHERE o.buyer_id = :uid
                ORDER BY o.created_at DESC
                LIMIT :lim
                """
            ),
            {"uid": buyer_id, "lim": limit},
        )
    ).mappings().all()
    return [dict(r) for r in rows]


async def list_store_orders(
    session: AsyncSession,
    store_id: str,
    owner_id: str,
    *,
    status: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
    page: int = 1,
    limit: int = 50,
) -> dict[str, Any]:
    store = (
        await session.execute(
            text("SELECT id FROM tcg_judge.stores WHERE id = :id AND owner_id = :oid"),
            {"id": store_id, "oid": owner_id},
        )
    ).mappings().first()
    if not store:
        raise HTTPException(404, "Loja não encontrada")

    conditions = ["o.store_id = :sid"]
    params: dict[str, Any] = {"sid": store_id, "lim": min(100, max(1, limit)), "off": (max(1, page) - 1) * limit}

    if status:
        conditions.append("o.status = :status")
        params["status"] = status
    if date_from:
        conditions.append("o.created_at >= CAST(:df AS timestamptz)")
        params["df"] = date_from
    if date_to:
        conditions.append("o.created_at <= CAST(:dt AS timestamptz)")
        params["dt"] = date_to

    where = " AND ".join(conditions)
    rows = (
        await session.execute(
            text(
                f"""
                SELECT o.*,
                  (SELECT json_agg(i.*) FROM tcg_judge.shop_order_items i WHERE i.order_id = o.id) AS items
                FROM tcg_judge.shop_orders o
                WHERE {where}
                ORDER BY o.created_at DESC
                LIMIT :lim OFFSET :off
                """
            ),
            params,
        )
    ).mappings().all()

    count_row = (
        await session.execute(
            text(f"SELECT COUNT(*) AS total FROM tcg_judge.shop_orders o WHERE {where}"),
            {k: v for k, v in params.items() if k not in {"lim", "off"}},
        )
    ).mappings().first()

    return {
        "orders": [dict(r) for r in rows],
        "total": int(count_row["total"]) if count_row else 0,
        "page": page,
        "limit": limit,
    }


async def update_order_status(
    session: AsyncSession,
    order_id: str,
    owner_id: str,
    status: str,
    *,
    tracking_code: str | None = None,
) -> dict[str, Any]:
    allowed = {"processing", "shipped", "delivered", "cancelled"}
    if status not in allowed:
        raise HTTPException(400, "Status inválido")

    extra_sets = ""
    params: dict[str, Any] = {"id": order_id, "status": status, "oid": owner_id}
    if status == "shipped":
        extra_sets = ", shipped_at = NOW(), tracking_code = COALESCE(:tracking, tracking_code)"
        params["tracking"] = tracking_code
    elif status == "delivered":
        extra_sets = ", delivered_at = NOW()"

    row = (
        await session.execute(
            text(
                f"""
                UPDATE tcg_judge.shop_orders o
                SET status = :status, updated_at = NOW(){extra_sets}
                FROM tcg_judge.stores s
                WHERE o.id = :id AND o.store_id = s.id AND s.owner_id = :oid
                RETURNING o.*
                """
            ),
            params,
        )
    ).mappings().first()
    if not row:
        raise HTTPException(404, "Pedido não encontrado")

    await session.execute(
        text(
            """
            INSERT INTO tcg_judge.shop_order_status_history (order_id, status, changed_by)
            VALUES (:oid, :status, :uid)
            """
        ),
        {"oid": order_id, "status": status, "uid": owner_id},
    )

    if status == "shipped":
        await notify_shop_event(
            session,
            "shop:order_shipped",
            order_id=order_id,
            body=f"Pedido enviado{f' — rastreio: {tracking_code}' if tracking_code else ''}",
        )
    elif status == "delivered":
        await notify_shop_event(
            session,
            "shop:order_delivered",
            order_id=order_id,
            body="Pedido entregue. Avalie sua compra!",
        )

    await session.commit()
    return dict(row)


async def export_store_orders_csv(
    session: AsyncSession, store_id: str, owner_id: str
) -> str:
    result = await list_store_orders(session, store_id, owner_id, limit=1000)
    lines = ["id,status,total_cents,payment_method,created_at,tracking_code"]
    for o in result["orders"]:
        lines.append(
            f"{o['id']},{o['status']},{o['total_cents']},{o.get('payment_method','')},"
            f"{o.get('created_at','')},{o.get('tracking_code') or ''}"
        )
    return "\n".join(lines)


async def get_buyer_order(session: AsyncSession, order_id: str, buyer_id: str) -> dict[str, Any]:
    row = (
        await session.execute(
            text(
                """
                SELECT o.*, s.name AS store_name, s.slug AS store_slug,
                  (SELECT json_agg(i.*) FROM tcg_judge.shop_order_items i WHERE i.order_id = o.id) AS items
                FROM tcg_judge.shop_orders o
                JOIN tcg_judge.stores s ON s.id = o.store_id
                WHERE o.id = :id AND o.buyer_id = :uid
                """
            ),
            {"id": order_id, "uid": buyer_id},
        )
    ).mappings().first()
    if not row:
        raise HTTPException(404, "Pedido não encontrado")
    return dict(row)


async def store_dashboard_enhanced(session: AsyncSession, store_id: str, owner_id: str) -> dict[str, Any]:
    base = await store_dashboard_stats(session, store_id, owner_id)
    sales = (
        await session.execute(
            text(
                """
                SELECT DATE(created_at) AS day,
                  COALESCE(SUM(store_receives_cents) FILTER (WHERE status = 'paid'), 0) AS revenue_cents,
                  COUNT(*) FILTER (WHERE status = 'paid') AS orders
                FROM tcg_judge.shop_orders
                WHERE store_id = :sid AND created_at >= NOW() - INTERVAL '30 days'
                GROUP BY DATE(created_at)
                ORDER BY day
                """
            ),
            {"sid": store_id},
        )
    ).mappings().all()
    top_products = (
        await session.execute(
            text(
                """
                SELECT i.product_name, SUM(i.quantity) AS qty
                FROM tcg_judge.shop_order_items i
                JOIN tcg_judge.shop_orders o ON o.id = i.order_id
                WHERE o.store_id = :sid AND o.status = 'paid'
                GROUP BY i.product_name
                ORDER BY qty DESC
                LIMIT 5
                """
            ),
            {"sid": store_id},
        )
    ).mappings().all()
    today = (
        await session.execute(
            text(
                """
                SELECT
                  COALESCE(SUM(store_receives_cents) FILTER (WHERE status = 'paid' AND created_at >= CURRENT_DATE), 0) AS today_cents,
                  COALESCE(SUM(store_receives_cents) FILTER (WHERE status = 'paid' AND created_at >= CURRENT_DATE - INTERVAL '7 days'), 0) AS week_cents,
                  COALESCE(SUM(store_receives_cents) FILTER (WHERE status = 'paid' AND created_at >= CURRENT_DATE - INTERVAL '30 days'), 0) AS month_cents
                FROM tcg_judge.shop_orders WHERE store_id = :sid
                """
            ),
            {"sid": store_id},
        )
    ).mappings().first()
    return {
        **base,
        "sales_chart": [dict(r) for r in sales],
        "top_products": [dict(r) for r in top_products],
        "revenue": dict(today) if today else {},
    }


async def store_dashboard_stats(session: AsyncSession, store_id: str, owner_id: str) -> dict[str, Any]:
    store = (
        await session.execute(
            text("SELECT * FROM tcg_judge.stores WHERE id = :id AND owner_id = :oid"),
            {"id": store_id, "oid": owner_id},
        )
    ).mappings().first()
    if not store:
        raise HTTPException(404, "Loja não encontrada")

    stats = (
        await session.execute(
            text(
                """
                SELECT
                  COUNT(*) FILTER (WHERE status = 'paid') AS paid_orders,
                  COUNT(*) FILTER (WHERE status = 'pending') AS pending_orders,
                  COALESCE(SUM(store_receives_cents) FILTER (WHERE status = 'paid'), 0) AS revenue_cents,
                  (SELECT COUNT(*) FROM tcg_judge.store_products WHERE store_id = :sid) AS product_count,
                  (SELECT COUNT(*) FROM tcg_judge.store_products WHERE store_id = :sid AND is_active) AS active_products
                FROM tcg_judge.shop_orders
                WHERE store_id = :sid
                """
            ),
            {"sid": store_id},
        )
    ).mappings().first()
    return {"store": dict(store), "stats": dict(stats) if stats else {}}


async def handle_payment_intent_succeeded(session: AsyncSession, settings: Settings, intent: dict[str, Any]) -> None:
    """Webhook: marca pedidos como pagos, transfere para lojas, decrementa estoque."""
    stripe.api_key = settings.stripe_secret_key or ""
    metadata = intent.get("metadata") or {}
    buyer_id = metadata.get("buyer_id")
    cart_id = metadata.get("cart_id")
    order_ids_raw = metadata.get("order_ids", "")
    store_splits_raw = metadata.get("store_splits", "{}")
    payment_intent_id = intent.get("id")
    transfer_group = intent.get("transfer_group")

    if not payment_intent_id:
        return

    try:
        store_splits: dict[str, int] = json.loads(store_splits_raw)
    except json.JSONDecodeError:
        store_splits = {}

    order_ids = [o.strip() for o in order_ids_raw.split(",") if o.strip()]

    for store_id, amount_cents in store_splits.items():
        store = (
            await session.execute(
                text("SELECT stripe_account_id, commission_rate FROM tcg_judge.stores WHERE id = :id"),
                {"id": store_id},
            )
        ).mappings().first()
        if not store or not store.get("stripe_account_id"):
            logger.warning("shop_transfer_skip", store_id=store_id)
            continue

        transfer_amount = int(amount_cents)
        if transfer_amount <= 0:
            continue

        try:
            stripe.Transfer.create(
                amount=transfer_amount,
                currency="brl",
                destination=str(store["stripe_account_id"]),
                transfer_group=transfer_group,
                metadata={"store_id": store_id, "payment_intent_id": payment_intent_id},
            )
        except stripe.StripeError as exc:
            logger.error("shop_transfer_failed", store_id=store_id, error=str(exc))

    if order_ids:
        for oid in order_ids:
            await session.execute(
                text(
                    """
                    UPDATE tcg_judge.shop_orders
                    SET status = 'paid', updated_at = NOW()
                    WHERE id = :id AND status = 'pending'
                    """
                ),
                {"id": oid},
            )
    elif payment_intent_id:
        await session.execute(
            text(
                """
                UPDATE tcg_judge.shop_orders
                SET status = 'paid', updated_at = NOW()
                WHERE stripe_payment_intent_id = :pi AND status = 'pending'
                """
            ),
            {"pi": payment_intent_id},
        )

    if order_ids:
        for oid in order_ids:
            items = (
                await session.execute(
                    text(
                        """
                        SELECT product_id, quantity FROM tcg_judge.shop_order_items
                        WHERE order_id = :oid
                        """
                    ),
                    {"oid": oid},
                )
            ).mappings().all()
            for item in items:
                await session.execute(
                    text(
                        """
                        UPDATE tcg_judge.store_products
                        SET stock = GREATEST(0, stock - :qty), updated_at = NOW()
                        WHERE id = :pid
                        """
                    ),
                    {"pid": str(item["product_id"]), "qty": int(item["quantity"])},
                )

    await session.commit()

    if buyer_id and cart_id:
        try:
            await shop_cart.clear_cart(session, str(buyer_id))
        except Exception as exc:
            logger.warning("shop_cart_clear_failed", error=str(exc))
