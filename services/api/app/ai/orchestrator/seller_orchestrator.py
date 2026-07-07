"""Orquestrador — agrega context providers em paralelo."""

from __future__ import annotations

import asyncio

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.context.analytics_context import AnalyticsContextProvider
from app.ai.context.finance_context import FinanceContextProvider
from app.ai.context.inventory_context import InventoryContextProvider
from app.ai.context.orders_context import OrdersContextProvider
from app.ai.context.pricing_context import PricingContextProvider
from app.ai.context.reputation_context import ReputationContextProvider
from app.ai.context.tickets_context import TicketsContextProvider
from app.ai.contracts.types import SellerContextBundle
from app.marketplace.seller_dashboard import resolve_owner_store

ALL_CONTEXT_PROVIDERS = [
    AnalyticsContextProvider(),
    OrdersContextProvider(),
    PricingContextProvider(),
    InventoryContextProvider(),
    FinanceContextProvider(),
    ReputationContextProvider(),
    TicketsContextProvider(),
]


async def gather_seller_context(session: AsyncSession, owner_id: str) -> SellerContextBundle:
    store = await resolve_owner_store(session, owner_id)
    store_id = str(store["id"])

    async def _fetch(provider):
        return provider.name, await provider.fetch(session, owner_id, store_id)

    results = await asyncio.gather(*[_fetch(p) for p in ALL_CONTEXT_PROVIDERS])
    data = dict(results)

    return SellerContextBundle(
        store_id=store_id,
        owner_id=owner_id,
        analytics=data.get("analytics") or {},
        orders=data.get("orders") or {},
        pricing=data.get("pricing") or {},
        inventory=data.get("inventory") or {},
        finance=data.get("finance") or {},
        reputation=data.get("reputation") or {},
        tickets=data.get("tickets") or {},
    )
