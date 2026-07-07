from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.analytics.pricing_intelligence import get_pricing_suggestions_read


class PricingContextProvider:
    name = "pricing"

    async def fetch(self, session: AsyncSession, owner_id: str, store_id: str) -> dict:
        pricing = await get_pricing_suggestions_read(session, store_id=store_id)
        items = pricing.get("items") or []
        above = [i for i in items if i.get("suggestion") == "lower"]
        below = [i for i in items if i.get("suggestion") == "raise"]
        return {
            "items": items,
            "opportunities": int(pricing.get("opportunities") or len(items)),
            "above_market_count": len(above),
            "below_market_count": len(below),
            "total": int(pricing.get("total") or len(items)),
        }
