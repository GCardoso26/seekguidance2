from __future__ import annotations

from app.marketplace import card_listings as listings_svc
from app.marketplace.seller_dashboard import get_dashboard_overview
from app.marketplace.seller_inventory_dashboard import get_inventory_dashboard
from sqlalchemy.ext.asyncio import AsyncSession


class InventoryContextProvider:
    name = "inventory"

    async def fetch(self, session: AsyncSession, owner_id: str, store_id: str) -> dict:
        overview = await get_dashboard_overview(session, owner_id)
        low_stock = overview.get("low_stock") or []
        inactive = await listings_svc.list_my_listings(session, owner_id, status="inactive")
        active = await listings_svc.list_my_listings(session, owner_id, status="active")
        missing_image = [
            listing
            for listing in active
            if not listing.get("images") and not listing.get("card_image_url") and not listing.get("image_url")
        ]

        dash = await get_inventory_dashboard(session, owner_id)
        actions = {a["id"]: int(a.get("count") or 0) for a in dash.get("actions") or []}
        never_sold_hint = 0  # MVP: métrica completa na próxima iteração

        return {
            "low_stock": low_stock,
            "low_stock_count": len(low_stock) or actions.get("low_stock", 0),
            "paused_listings_count": len(inactive) or actions.get("unpublished", 0),
            "missing_image_count": len(missing_image) or actions.get("missing_image", 0),
            "missing_image_listings": missing_image[:10],
            "paused_listings": inactive[:10],
            "out_of_stock_count": actions.get("out_of_stock", 0),
            "awaiting_review_count": actions.get("awaiting_review", 0),
            "never_sold_count": never_sold_hint,
            "above_market_hint_count": 0,
            "dashboard_totals": dash.get("totals") or {},
            "suggestions": [
                f"{actions.get('missing_image', 0)} anúncios sem imagem.",
                f"{actions.get('out_of_stock', 0)} produtos sem estoque.",
                f"{actions.get('unpublished', 0)} itens não publicados.",
                f"{actions.get('awaiting_review', 0)} aguardando revisão.",
            ],
            "store_id": store_id,
        }
