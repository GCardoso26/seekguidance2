"""Pedidos e fulfillment do marketplace."""

from __future__ import annotations

import json
from typing import Any

import structlog
from app.core.config import Settings, get_settings
from app.marketplace import shop_cart
from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

import stripe

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


async def list_store_orders(session: AsyncSession, store_id: str, owner_id: str, limit: int = 50) -> list[dict[str, Any]]:
    store = (
        await session.execute(
            text("SELECT id FROM tcg_judge.stores WHERE id = :id AND owner_id = :oid"),
            {"id": store_id, "oid": owner_id},
        )
    ).mappings().first()
    if not store:
        raise HTTPException(404, "Loja não encontrada")

    rows = (
        await session.execute(
            text(
                """
                SELECT o.*,
                  (SELECT json_agg(i.*) FROM tcg_judge.shop_order_items i WHERE i.order_id = o.id) AS items
                FROM tcg_judge.shop_orders o
                WHERE o.store_id = :sid
                ORDER BY o.created_at DESC
                LIMIT :lim
                """
            ),
            {"sid": store_id, "lim": limit},
        )
    ).mappings().all()
    return [dict(r) for r in rows]


async def update_order_status(
    session: AsyncSession, order_id: str, owner_id: str, status: str
) -> dict[str, Any]:
    allowed = {"processing", "shipped", "delivered", "cancelled"}
    if status not in allowed:
        raise HTTPException(400, "Status inválido")

    row = (
        await session.execute(
            text(
                """
                UPDATE tcg_judge.shop_orders o
                SET status = :status, updated_at = NOW()
                FROM tcg_judge.stores s
                WHERE o.id = :id AND o.store_id = s.id AND s.owner_id = :oid
                RETURNING o.*
                """
            ),
            {"id": order_id, "status": status, "oid": owner_id},
        )
    ).mappings().first()
    if not row:
        raise HTTPException(404, "Pedido não encontrado")
    await session.commit()
    return dict(row)


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

        commission = float(store.get("commission_rate") or 0.15)
        transfer_amount = int(amount_cents * (1 - commission))
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
