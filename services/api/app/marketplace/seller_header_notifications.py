"""Notificações agregadas para o header do painel lojista."""

from __future__ import annotations

import asyncio
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.marketplace.seller_dashboard import (
    _count_open_tickets,
    _count_pending_payment,
    _count_to_separate,
    resolve_owner_store,
)


async def _count_recent_payments(session: AsyncSession, store_id: str) -> int:
    row = (
        await session.execute(
            text(
                """
                SELECT COUNT(*) AS cnt
                FROM tcg_judge.shop_orders
                WHERE store_id = :sid
                  AND status IN ('paid', 'processing')
                  AND created_at >= NOW() - INTERVAL '24 hours'
                """
            ),
            {"sid": store_id},
        )
    ).mappings().first()
    return int(row["cnt"] if row else 0)


async def _count_chargebacks(session: AsyncSession, store_id: str) -> int:
    try:
        row = (
            await session.execute(
                text(
                    """
                    SELECT COUNT(*)::int AS cnt FROM (
                      SELECT id FROM tcg_judge.chargebacks
                      WHERE store_id = CAST(:sid AS uuid)
                        AND status IN ('opened', 'under_review')
                      UNION ALL
                      SELECT NULL::uuid FROM tcg_judge.shop_orders
                      WHERE store_id = CAST(:sid AS uuid) AND status = 'disputed'
                        AND NOT EXISTS (
                          SELECT 1 FROM tcg_judge.chargebacks cb
                          WHERE cb.shop_order_id = shop_orders.id
                        )
                    ) t
                    """
                ),
                {"sid": store_id},
            )
        ).mappings().first()
        return int(row["cnt"] if row else 0)
    except Exception:
        return 0


async def get_header_notifications(session: AsyncSession, owner_id: str) -> dict[str, Any]:
    store = await resolve_owner_store(session, owner_id)
    store_id = str(store["id"])

    pending, to_separate, open_tickets, recent_payments, chargebacks = await asyncio.gather(
        _count_pending_payment(session, store_id),
        _count_to_separate(session, store_id),
        _count_open_tickets(session, store_id),
        _count_recent_payments(session, store_id),
        _count_chargebacks(session, store_id),
    )

    new_orders = pending + to_separate
    categories: list[dict[str, Any]] = []

    if new_orders > 0:
        categories.append(
            {
                "type": "new_orders",
                "label": f"{new_orders} novos pedidos",
                "count": new_orders,
                "action": "/vendedor/painel/pedidos",
            }
        )
    if open_tickets > 0:
        categories.append(
            {
                "type": "tickets",
                "label": f"{open_tickets} tickets",
                "count": open_tickets,
                "action": "/vendedor/painel/atendimento/tickets",
            }
        )
    if recent_payments > 0:
        categories.append(
            {
                "type": "payments",
                "label": f"{recent_payments} pagamentos",
                "count": recent_payments,
                "action": "/vendedor/painel/financeiro/receitas",
            }
        )
    if chargebacks > 0:
        categories.append(
            {
                "type": "chargeback",
                "label": f"{chargebacks} chargeback(s)",
                "count": chargebacks,
                "action": "/vendedor/painel/financeiro/stripe",
                "urgent": True,
            }
        )

    total_unread = sum(c["count"] for c in categories)
    return {"total_unread": total_unread, "categories": categories}
