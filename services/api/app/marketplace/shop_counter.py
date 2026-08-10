"""Checkout balcão (counter) para ingressos EVENT — hold 24h + confirmação do lojista."""

from __future__ import annotations

import json
from datetime import UTC, datetime, timedelta
from typing import Any

import structlog
from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.kyc.player_account import require_active_account
from app.marketplace import checkout_atomic, shop_cart
from app.marketplace.checkout_atomic import apply_sale_stock_deduction, sync_event_ticket_availability
from app.players.store import ensure_player_profile

logger = structlog.get_logger(__name__)

COUNTER_HOLD_HOURS = 24


async def expire_counter_orders(session: AsyncSession) -> int:
    result = await session.execute(text("SELECT tcg_judge.expire_counter_orders()"))
    count = int(result.scalar() or 0)
    await session.commit()
    return count


async def create_counter_checkout(
    session: AsyncSession,
    user_id: str,
    *,
    checkout_session_id: str | None = None,
) -> dict[str, Any]:
    """Cria pedido awaiting_counter_payment com hold 24h (somente linhas EVENT)."""
    await ensure_player_profile(session, user_id)
    await require_active_account(session, user_id)

    try:
        await expire_counter_orders(session)
    except Exception as exc:
        logger.warning("expire_counter_orders_skipped", error=str(exc))

    cart = await shop_cart.get_cart(session, user_id)
    items = list(cart.get("items") or [])
    if not items:
        raise HTTPException(400, "Carrinho vazio")

    product_ids = [str(i["product_id"]) for i in items if i.get("product_id")]
    rows = (
        await session.execute(
            text(
                """
                SELECT p.id::text, p.category, p.price_cents, p.name, p.store_id::text,
                       p.stock, COALESCE(p.reserved_stock, 0) AS reserved_stock,
                       p.images, s.owner_id::text AS seller_id, s.name AS store_name
                FROM tcg_judge.store_products p
                JOIN tcg_judge.stores s ON s.id = p.store_id
                WHERE p.id = ANY(CAST(:ids AS uuid[])) AND p.is_active = true
                """
            ),
            {"ids": product_ids},
        )
    ).mappings().all()
    products = {str(r["id"]): dict(r) for r in rows}
    if len(products) != len(product_ids):
        raise HTTPException(400, "Produto indisponível no carrinho")

    if any(str(p.get("category") or "") != "event" for p in products.values()):
        raise HTTPException(
            400,
            "Pagamento no balcão disponível apenas para carrinho só com ingressos (EVENT).",
        )

    # Reserva via sessão atômica existente ou nova
    if checkout_session_id:
        checkout = await checkout_atomic.get_active_session(session, checkout_session_id, user_id)
        locked = checkout.get("locked_items") or []
    else:
        checkout = await checkout_atomic.initiate_checkout(session, user_id)
        checkout_session_id = str(checkout["session_id"])
        locked = checkout.get("locked_items") or []

    # Agrupa por loja
    store_lines: dict[str, list[dict[str, Any]]] = {}
    store_totals: dict[str, int] = {}
    for item in locked:
        pid = str(item["product_id"])
        product = products[pid]
        sid = str(product["store_id"])
        qty = int(item["quantity"])
        line_total = int(product["price_cents"]) * qty
        store_totals[sid] = store_totals.get(sid, 0) + line_total
        images = product.get("images") or []
        image = images[0] if isinstance(images, list) and images else None
        store_lines.setdefault(sid, []).append(
            {
                "product_id": pid,
                "product_name": product["name"],
                "product_image": image,
                "quantity": qty,
                "unit_price_cents": int(product["price_cents"]),
                "total_price_cents": line_total,
            }
        )

    expires_at = datetime.now(UTC) + timedelta(hours=COUNTER_HOLD_HOURS)
    order_ids: list[str] = []

    for store_id, lines in store_lines.items():
        total = int(store_totals.get(store_id, 0))
        order_row = (
            await session.execute(
                text(
                    """
                    INSERT INTO tcg_judge.shop_orders (
                      buyer_id, store_id, status, total_cents,
                      platform_fee_cents, store_receives_cents,
                      payment_method, expires_at, subtotal_cents
                    ) VALUES (
                      :buyer, CAST(:store AS uuid), 'awaiting_counter_payment', :total,
                      0, :total, 'counter', :expires, :total
                    )
                    RETURNING id::text
                    """
                ),
                {
                    "buyer": user_id,
                    "store": store_id,
                    "total": total,
                    "expires": expires_at,
                },
            )
        ).mappings().first()
        order_id = str(order_row["id"]) if order_row else None
        if not order_id:
            raise HTTPException(500, "Falha ao criar pedido balcão")
        order_ids.append(order_id)
        for line in lines:
            await session.execute(
                text(
                    """
                    INSERT INTO tcg_judge.shop_order_items (
                      order_id, product_id, product_name, product_image,
                      quantity, unit_price_cents, total_price_cents
                    ) VALUES (
                      CAST(:oid AS uuid), CAST(:pid AS uuid), :name, :img,
                      :qty, :unit, :total
                    )
                    """
                ),
                {
                    "oid": order_id,
                    "pid": line["product_id"],
                    "name": line["product_name"],
                    "img": line.get("product_image"),
                    "qty": line["quantity"],
                    "unit": line["unit_price_cents"],
                    "total": line["total_price_cents"],
                },
            )
            await sync_event_ticket_availability(session, line["product_id"])

    # Sessão de checkout: completa sem baixar estoque (hold fica no pedido)
    await session.execute(
        text(
            """
            UPDATE tcg_judge.checkout_sessions
            SET status = 'completed',
                completed_at = NOW(),
                payment_method = 'counter'
            WHERE id = CAST(:id AS uuid) AND status = 'active'
            """
        ),
        {"id": checkout_session_id},
    )
    await shop_cart.clear_cart(session, user_id)
    await session.commit()

    return {
        "orders": order_ids,
        "order_id": order_ids[0] if order_ids else None,
        "status": "awaiting_counter_payment",
        "payment_method": "counter",
        "expires_at": expires_at.isoformat(),
        "hold_hours": COUNTER_HOLD_HOURS,
    }


async def confirm_counter_payment(
    session: AsyncSession,
    order_id: str,
    owner_id: str,
) -> dict[str, Any]:
    """Lojista confirma pagamento no balcão → baixa estoque e marca paid."""
    try:
        await expire_counter_orders(session)
    except Exception as exc:
        logger.warning("expire_counter_orders_skipped", error=str(exc))

    row = (
        await session.execute(
            text(
                """
                SELECT o.*, s.owner_id::text AS owner_id
                FROM tcg_judge.shop_orders o
                JOIN tcg_judge.stores s ON s.id = o.store_id
                WHERE o.id = CAST(:id AS uuid)
                LIMIT 1
                """
            ),
            {"id": order_id},
        )
    ).mappings().first()
    if not row:
        raise HTTPException(404, "Pedido não encontrado")
    if str(row["owner_id"]) != str(owner_id):
        raise HTTPException(403, "Sem permissão para este pedido")
    if str(row["status"]) != "awaiting_counter_payment" or str(row["payment_method"]) != "counter":
        raise HTTPException(400, "Pedido não está aguardando pagamento no balcão")

    items = (
        await session.execute(
            text(
                """
                SELECT product_id::text, quantity
                FROM tcg_judge.shop_order_items
                WHERE order_id = CAST(:oid AS uuid)
                """
            ),
            {"oid": order_id},
        )
    ).mappings().all()

    for item in items:
        await apply_sale_stock_deduction(
            session,
            str(item["product_id"]),
            int(item["quantity"]),
            require_reserved=True,
        )
        await sync_event_ticket_availability(session, str(item["product_id"]))

    await session.execute(
        text(
            """
            UPDATE tcg_judge.shop_orders
            SET status = 'paid', paid_at = NOW(), updated_at = NOW(), expires_at = NULL
            WHERE id = CAST(:id AS uuid)
            """
        ),
        {"id": order_id},
    )
    await session.execute(
        text(
            """
            INSERT INTO tcg_judge.shop_order_status_history (order_id, status, changed_by)
            VALUES (CAST(:oid AS uuid), 'paid', :uid)
            """
        ),
        {"oid": order_id, "uid": owner_id},
    )
    await session.commit()
    return {"order_id": order_id, "status": "paid", "payment_method": "counter"}


async def list_store_counter_orders(
    session: AsyncSession,
    store_id: str,
    owner_id: str,
) -> list[dict[str, Any]]:
    try:
        await expire_counter_orders(session)
    except Exception as exc:
        logger.warning("expire_counter_orders_skipped", error=str(exc))

    own = (
        await session.execute(
            text(
                """
                SELECT id FROM tcg_judge.stores
                WHERE id = CAST(:sid AS uuid) AND owner_id = :oid
                LIMIT 1
                """
            ),
            {"sid": store_id, "oid": owner_id},
        )
    ).mappings().first()
    if not own:
        raise HTTPException(403, "Loja não encontrada")

    rows = (
        await session.execute(
            text(
                """
                SELECT o.id::text, o.status, o.total_cents, o.payment_method,
                       o.expires_at, o.created_at, o.buyer_id,
                       (SELECT json_agg(json_build_object(
                          'product_id', i.product_id::text,
                          'product_name', i.product_name,
                          'quantity', i.quantity,
                          'unit_price_cents', i.unit_price_cents
                        ))
                        FROM tcg_judge.shop_order_items i
                        WHERE i.order_id = o.id) AS items
                FROM tcg_judge.shop_orders o
                WHERE o.store_id = CAST(:sid AS uuid)
                  AND o.payment_method = 'counter'
                  AND o.status = 'awaiting_counter_payment'
                ORDER BY o.expires_at ASC NULLS LAST, o.created_at ASC
                LIMIT 100
                """
            ),
            {"sid": store_id},
        )
    ).mappings().all()
    out: list[dict[str, Any]] = []
    for r in rows:
        d = dict(r)
        if d.get("expires_at"):
            d["expires_at"] = d["expires_at"].isoformat()
        if d.get("created_at"):
            d["created_at"] = d["created_at"].isoformat()
        items = d.get("items")
        if isinstance(items, str):
            d["items"] = json.loads(items)
        out.append(d)
    return out
