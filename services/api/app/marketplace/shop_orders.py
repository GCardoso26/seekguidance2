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
from app.marketplace.shop_commission import store_receives_cents
from app.marketplace.shop_notifications import notify_shop_event

logger = structlog.get_logger(__name__)


def _parse_store_transfer_amounts(metadata: dict[str, Any]) -> dict[str, int]:
    raw = metadata.get("store_transfer_splits")
    if raw:
        try:
            parsed = json.loads(raw)
            if isinstance(parsed, dict):
                return {str(k): int(v) for k, v in parsed.items()}
        except (json.JSONDecodeError, TypeError, ValueError):
            pass

    gross_raw = metadata.get("store_splits", "{}")
    try:
        gross_splits: dict[str, int] = json.loads(gross_raw)
    except json.JSONDecodeError:
        return {}

    return {str(store_id): store_receives_cents(int(amount)) for store_id, amount in gross_splits.items()}


async def _transfer_store_payouts(
    session: AsyncSession,
    *,
    order_ids: list[str],
    payment_intent_id: str,
    transfer_group: str | None,
    store_transfer_amounts: dict[str, int],
) -> None:
    if order_ids:
        rows = (
            await session.execute(
                text(
                    """
                    SELECT id, store_id, store_receives_cents, stripe_transfer_id
                    FROM tcg_judge.shop_orders
                    WHERE id = ANY(CAST(:oids AS uuid[]))
                    """
                ),
                {"oids": order_ids},
            )
        ).mappings().all()
        for order in rows:
            oid = str(order["id"])
            if order.get("stripe_transfer_id"):
                logger.info("shop_transfer_skip_existing", order_id=oid)
                continue
            store_id = str(order["store_id"])
            amount = int(order.get("store_receives_cents") or 0)
            if amount <= 0:
                amount = store_transfer_amounts.get(store_id, 0)
            if amount <= 0:
                continue
            await _create_store_transfer(
                session,
                store_id=store_id,
                amount_cents=amount,
                payment_intent_id=payment_intent_id,
                transfer_group=transfer_group,
                order_id=oid,
            )
        return

    for store_id, amount_cents in store_transfer_amounts.items():
        if amount_cents <= 0:
            continue
        await _create_store_transfer(
            session,
            store_id=store_id,
            amount_cents=amount_cents,
            payment_intent_id=payment_intent_id,
            transfer_group=transfer_group,
            order_id=None,
        )


async def _create_store_transfer(
    session: AsyncSession,
    *,
    store_id: str,
    amount_cents: int,
    payment_intent_id: str,
    transfer_group: str | None,
    order_id: str | None,
) -> None:
    store = (
        await session.execute(
            text("SELECT stripe_account_id FROM tcg_judge.stores WHERE id = :id"),
            {"id": store_id},
        )
    ).mappings().first()
    if not store or not store.get("stripe_account_id"):
        logger.warning("shop_transfer_skip", store_id=store_id)
        return

    idem_suffix = order_id or store_id
    idempotency_key = f"shop-pi-{payment_intent_id}-{idem_suffix}"[:255]

    try:
        transfer = stripe.Transfer.create(
            amount=int(amount_cents),
            currency="brl",
            destination=str(store["stripe_account_id"]),
            transfer_group=transfer_group,
            metadata={
                "store_id": store_id,
                "payment_intent_id": payment_intent_id,
                "order_id": order_id or "",
            },
            idempotency_key=idempotency_key,
        )
    except stripe.StripeError as exc:
        logger.error("shop_transfer_failed", store_id=store_id, order_id=order_id, error=str(exc))
        return

    if order_id and transfer and getattr(transfer, "id", None):
        await session.execute(
            text(
                """
                UPDATE tcg_judge.shop_orders
                SET stripe_transfer_id = :tid, updated_at = NOW()
                WHERE id = :oid AND stripe_transfer_id IS NULL
                """
            ),
            {"tid": str(transfer.id), "oid": order_id},
        )


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
    tab: str | None = None,
    search: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
    min_value_cents: int | None = None,
    max_value_cents: int | None = None,
    payment_method: str | None = None,
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
    needs_profile_join = bool(search)

    effective_tab = tab or None
    if effective_tab and effective_tab != "all":
        if effective_tab in {"pending_payment", "pending"}:
            conditions.append("o.status = 'pending'")
        elif effective_tab == "paid":
            conditions.append("o.status = 'paid'")
        elif effective_tab == "to_separate":
            conditions.append("(o.status IN ('paid', 'processing') AND o.shipped_at IS NULL)")
        elif effective_tab == "shipped":
            conditions.append("o.status = 'shipped'")
        elif effective_tab == "delivered":
            conditions.append("o.status = 'delivered'")
        elif effective_tab == "cancelled":
            conditions.append("o.status = 'cancelled'")
        elif effective_tab == "refunded":
            conditions.append("1 = 0")
    elif status:
        conditions.append("o.status = :status")
        params["status"] = status

    if search:
        term = search.strip()
        if term:
            params["search_pat"] = f"%{term}%"
            params["search_exact"] = term
            conditions.append(
                """(
                    o.id::text ILIKE :search_pat
                    OR COALESCE(p.display_name, '') ILIKE :search_pat
                    OR COALESCE(p.handle, '') ILIKE :search_pat
                    OR COALESCE(o.tracking_code, '') = :search_exact
                    OR EXISTS (
                        SELECT 1 FROM tcg_judge.shop_order_items oi
                        LEFT JOIN tcg_judge.store_products sp ON sp.id = oi.product_id
                        WHERE oi.order_id = o.id AND (
                            oi.product_name ILIKE :search_pat
                            OR COALESCE(sp.sku, '') ILIKE :search_pat
                        )
                    )
                )"""
            )

    if date_from:
        conditions.append("o.created_at >= CAST(:df AS timestamptz)")
        params["df"] = date_from
    if date_to:
        conditions.append("o.created_at <= CAST(:dt AS timestamptz)")
        params["dt"] = date_to
    if min_value_cents is not None:
        conditions.append("o.total_cents >= :min_val")
        params["min_val"] = min_value_cents
    if max_value_cents is not None:
        conditions.append("o.total_cents <= :max_val")
        params["max_val"] = max_value_cents
    if payment_method:
        conditions.append("o.payment_method = :pm")
        params["pm"] = payment_method

    where = " AND ".join(conditions)
    profile_join = "LEFT JOIN tcg_judge.player_profiles p ON p.id = o.buyer_id" if needs_profile_join else ""
    buyer_select = ", p.display_name AS buyer_name" if needs_profile_join else ""

    rows = (
        await session.execute(
            text(
                f"""
                SELECT o.*,
                  (SELECT json_agg(i.*) FROM tcg_judge.shop_order_items i WHERE i.order_id = o.id) AS items
                  {buyer_select}
                FROM tcg_judge.shop_orders o
                {profile_join}
                WHERE {where}
                ORDER BY o.created_at DESC
                LIMIT :lim OFFSET :off
                """
            ),
            params,
        )
    ).mappings().all()

    count_params = {k: v for k, v in params.items() if k not in {"lim", "off"}}
    count_from = "tcg_judge.shop_orders o"
    count_join = profile_join
    count_row = (
        await session.execute(
            text(f"SELECT COUNT(*) AS total FROM {count_from} {count_join} WHERE {where}"),
            count_params,
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

    from app.marketplace import shop_escrow

    await shop_escrow.sync_escrow_with_order_status(session, order_id, status)

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


async def get_buyer_order_with_escrow(
    session: AsyncSession, order_id: str, buyer_id: str
) -> dict[str, Any]:
    from app.marketplace import shop_escrow

    order = await get_buyer_order(session, order_id, buyer_id)
    escrow = await shop_escrow.get_escrow_by_order(session, order_id)
    if escrow:
        order["escrow"] = escrow
    return order


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
                  COALESCE(SUM(store_receives_cents) FILTER (
                    WHERE status = 'paid' AND created_at >= CURRENT_DATE
                  ), 0) AS today_cents,
                  COALESCE(SUM(store_receives_cents) FILTER (
                    WHERE status = 'paid'
                      AND created_at >= CURRENT_DATE - INTERVAL '7 days'
                  ), 0) AS week_cents,
                  COALESCE(SUM(store_receives_cents) FILTER (
                    WHERE status = 'paid'
                      AND created_at >= CURRENT_DATE - INTERVAL '30 days'
                  ), 0) AS month_cents
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
    payment_intent_id = intent.get("id")
    transfer_group = intent.get("transfer_group")

    if not payment_intent_id:
        return

    use_escrow = str(metadata.get("use_escrow", "")).lower() == "true"
    destination_charge = str(metadata.get("connect_destination_charge", "")).lower() == "true"
    order_ids = [o.strip() for o in order_ids_raw.split(",") if o.strip()]
    checkout_session_id = metadata.get("checkout_session_id")
    stock_finalized = False

    if checkout_session_id:
        from app.marketplace import checkout_atomic

        try:
            await checkout_atomic.finalize_checkout(
                session,
                checkout_session_id,
                payment_intent_id=payment_intent_id,
                payment_method="stripe",
            )
            stock_finalized = True
        except Exception as exc:
            logger.error("checkout_finalize_failed", session_id=checkout_session_id, error=str(exc))

    store_transfer_amounts = _parse_store_transfer_amounts(metadata)

    if not use_escrow and not destination_charge and store_transfer_amounts:
        await _transfer_store_payouts(
            session,
            order_ids=order_ids,
            payment_intent_id=str(payment_intent_id),
            transfer_group=transfer_group,
            store_transfer_amounts=store_transfer_amounts,
        )

    if order_ids:
        for oid in order_ids:
            if use_escrow:
                from app.marketplace import shop_escrow

                await shop_escrow.on_payment_received(
                    session, oid, payment_intent_id=payment_intent_id
                )
            else:
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
                from app.marketplace.seller_fulfillment import on_order_paid_enqueue_fulfillment

                await on_order_paid_enqueue_fulfillment(session, oid)

        from app.payments.payment_aggregate import record_payment_captured

        for oid in order_ids:
            try:
                await record_payment_captured(
                    session,
                    shop_order_id=oid,
                    stripe_payment_intent_id=str(payment_intent_id),
                )
            except Exception as exc:
                logger.warning("payment_aggregate_capture_failed", order_id=oid, error=str(exc))
    elif payment_intent_id and not use_escrow:
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

    if order_ids and not stock_finalized:
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

    if order_ids:
        from app.gamification.xp import award_xp_for_paid_order
        from app.marketplace import shop_crm

        for oid in order_ids:
            try:
                await award_xp_for_paid_order(session, oid)
            except Exception as exc:
                logger.warning("liga_pass_xp_failed", order_id=oid, error=str(exc))
            try:
                order_row = (
                    await session.execute(
                        text(
                            """
                            SELECT o.store_id, o.buyer_id, o.total_cents, p.display_name
                            FROM tcg_judge.shop_orders o
                            LEFT JOIN tcg_judge.player_profiles p ON p.id = o.buyer_id
                            WHERE o.id = :id
                            """
                        ),
                        {"id": oid},
                    )
                ).mappings().first()
                if order_row and order_row.get("buyer_id"):
                    await shop_crm.upsert_customer_from_order(
                        session,
                        store_id=str(order_row["store_id"]),
                        customer_id=str(order_row["buyer_id"]),
                        amount_cents=int(order_row.get("total_cents") or 0),
                        display_name=order_row.get("display_name"),
                    )
            except Exception as exc:
                logger.warning("crm_sync_failed", order_id=oid, error=str(exc))
    elif payment_intent_id:
        paid_orders = (
            await session.execute(
                text(
                    """
                    SELECT id FROM tcg_judge.shop_orders
                    WHERE stripe_payment_intent_id = :pi AND status = 'paid'
                    """
                ),
                {"pi": payment_intent_id},
            )
        ).mappings().all()
        from app.gamification.xp import award_xp_for_paid_order

        for row in paid_orders:
            try:
                await award_xp_for_paid_order(session, str(row["id"]))
            except Exception as exc:
                logger.warning("liga_pass_xp_failed", order_id=str(row["id"]), error=str(exc))

    await session.commit()

    if buyer_id and cart_id:
        try:
            await shop_cart.clear_cart(session, str(buyer_id))
        except Exception as exc:
            logger.warning("shop_cart_clear_failed", error=str(exc))
