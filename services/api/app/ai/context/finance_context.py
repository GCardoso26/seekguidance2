from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.marketplace import seller_finance as seller_fin
from app.marketplace.seller_header_notifications import get_header_notifications


class FinanceContextProvider:
    name = "finance"

    async def fetch(self, session: AsyncSession, owner_id: str, store_id: str) -> dict:
        payouts = await seller_fin.get_payouts_summary(session, owner_id)
        notifications = await get_header_notifications(session, owner_id)
        chargebacks = 0
        for cat in notifications.get("categories") or []:
            if cat.get("type") == "chargeback":
                chargebacks = int(cat.get("count") or 0)
        return {
            "payouts": payouts,
            "expected_payout_cents": int(payouts.get("pending_cents") or payouts.get("available_cents") or 0),
            "chargebacks_open": chargebacks,
            "notifications": notifications,
        }
