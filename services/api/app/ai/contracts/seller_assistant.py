"""Interface SellerAssistant — desacoplada de provedor LLM."""

from __future__ import annotations

from typing import Protocol

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.contracts.types import ActionPlan, DailyBrief, SellerContextBundle, SellerInsight


class SellerAssistant(Protocol):
    async def generate_daily_brief(
        self,
        session: AsyncSession,
        context: SellerContextBundle,
    ) -> DailyBrief: ...

    async def generate_insights(
        self,
        session: AsyncSession,
        context: SellerContextBundle,
    ) -> list[SellerInsight]: ...

    async def prepare_action(
        self,
        session: AsyncSession,
        context: SellerContextBundle,
        *,
        action_type: str,
        insight_id: str | None = None,
        payload: dict | None = None,
    ) -> ActionPlan: ...
