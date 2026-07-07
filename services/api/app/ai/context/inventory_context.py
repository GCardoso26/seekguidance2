from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.marketplace import card_listings as listings_svc
from app.marketplace.seller_dashboard import get_dashboard_overview


class InventoryContextProvider:
    name = "inventory"

    async def fetch(self, session: AsyncSession, owner_id: str, store_id: str) -> dict:
        overview = await get_dashboard_overview(session, owner_id)
        low_stock = overview.get("low_stock") or []
        inactive = await listings_svc.list_my_listings(session, owner_id, status="inactive")
        active = await listings_svc.list_my_listings(session, owner_id, status="active")
        missing_image = [
            l
            for l in active
            if not l.get("images") and not l.get("card_image_url") and not l.get("image_url")
        ]
        return {
            "low_stock": low_stock,
            "low_stock_count": len(low_stock),
            "paused_listings_count": len(inactive),
            "missing_image_count": len(missing_image),
            "missing_image_listings": missing_image[:10],
            "paused_listings": inactive[:10],
        }
