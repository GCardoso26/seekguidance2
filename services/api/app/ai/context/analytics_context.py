from __future__ import annotations

from app.analytics.intelligence_service import get_sales_insights
from sqlalchemy.ext.asyncio import AsyncSession


class AnalyticsContextProvider:
    name = "analytics"

    async def fetch(self, session: AsyncSession, owner_id: str, store_id: str) -> dict:
        sales = await get_sales_insights(session, owner_id, period="30d")
        return {"sales": sales, "store_id": store_id}
