"""Notificações do marketplace (pedidos, PIX, assinatura Pro)."""

from __future__ import annotations

from typing import Any

import structlog
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.notifications.service import notification_service

logger = structlog.get_logger(__name__)

SHOP_EVENT_TITLES = {
    "shop:order_created": "Novo pedido na loja",
    "shop:pix_paid": "Pagamento PIX confirmado",
    "shop:order_shipped": "Pedido enviado",
    "shop:order_delivered": "Pedido entregue",
    "shop:pro_activated": "Pro Loja ativado",
    "shop:review_received": "Nova avaliação",
}


async def _order_parties(session: AsyncSession, order_id: str) -> dict[str, Any] | None:
    row = (
        await session.execute(
            text(
                """
                SELECT o.*, s.name AS store_name, s.owner_id AS store_owner_id
                FROM tcg_judge.shop_orders o
                JOIN tcg_judge.stores s ON s.id = o.store_id
                WHERE o.id = :id
                """
            ),
            {"id": order_id},
        )
    ).mappings().first()
    return dict(row) if row else None


async def notify_shop_event(
    session: AsyncSession,
    event_type: str,
    *,
    order_id: str | None = None,
    store_owner_id: str | None = None,
    buyer_id: str | None = None,
    body: str | None = None,
    data: dict[str, Any] | None = None,
) -> None:
    if order_id:
        order = await _order_parties(session, order_id)
        if order:
            buyer_id = buyer_id or str(order["buyer_id"])
            store_owner_id = store_owner_id or str(order["store_owner_id"])
            data = {
                **(data or {}),
                "order_id": order_id,
                "store_id": str(order["store_id"]),
                "store_name": order.get("store_name"),
            }

    recipients: list[str] = []
    if event_type == "shop:order_created" and store_owner_id:
        recipients = [store_owner_id]
    elif event_type == "shop:pix_paid":
        if buyer_id:
            recipients.append(buyer_id)
        if store_owner_id:
            recipients.append(store_owner_id)
    elif event_type in {"shop:order_shipped", "shop:order_delivered"} and buyer_id:
        recipients = [buyer_id]
    elif event_type == "shop:pro_activated" and store_owner_id:
        recipients = [store_owner_id]
    elif event_type == "shop:review_received" and store_owner_id:
        recipients = [store_owner_id]
    elif event_type == "buylist:accepted" and buyer_id:
        recipients = [buyer_id]
    elif event_type == "buylist:rejected" and buyer_id:
        recipients = [buyer_id]

    if not recipients:
        return

    try:
        await notification_service.send(
            session,
            event_type,
            player_ids=list(dict.fromkeys(recipients)),
            body=body,
            data=data,
            channels=["in_app", "push", "email"],
        )
        await session.commit()
    except Exception as exc:
        logger.warning("shop_notification_failed", event=event_type, error=str(exc))
