from __future__ import annotations

from app.marketplace import seller_fulfillment as seller_ff
from app.marketplace.seller_dashboard import get_dashboard_overview
from sqlalchemy.ext.asyncio import AsyncSession


class OrdersContextProvider:
    name = "orders"

    async def fetch(self, session: AsyncSession, owner_id: str, store_id: str) -> dict:
        overview = await get_dashboard_overview(session, owner_id)
        sla = overview.get("fulfillment_sla") or await seller_ff.get_fulfillment_sla_metrics(session, store_id)
        metrics = overview.get("metrics") or {}
        return {
            "overview": overview,
            "sla": sla,
            "pending_payment": int(metrics.get("pending_payment") or 0),
            "to_separate": int(metrics.get("to_separate") or 0),
            "shipped_today": int(metrics.get("shipped_today") or 0),
            "revenue_today_cents": int(metrics.get("revenue_today_cents") or 0),
            "recent_orders": overview.get("recent_orders") or [],
            "late_orders_count": int(sla.get("breached_count") or sla.get("overdue") or 0),
        }
