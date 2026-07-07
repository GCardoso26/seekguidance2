"""Application Service — entrada Seller AI (Sprint 12)."""

from __future__ import annotations

import os
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.assistant.seller_copilot import SellerCopilot
from app.ai.contracts.types import ActionPlan, DailyBrief, SellerInsight
from app.ai.orchestrator.seller_orchestrator import gather_seller_context
from app.ai.providers.claude_provider import ClaudeLlmProvider
from app.ai.providers.mock_provider import MockLlmProvider
from app.ai.providers.openai_provider import OpenAiLlmProvider


def _resolve_llm_provider():
    kind = os.getenv("SELLER_AI_LLM_PROVIDER", "mock").lower()
    if kind == "openai":
        return OpenAiLlmProvider()
    if kind == "claude":
        return ClaudeLlmProvider()
    return MockLlmProvider()


def _copilot() -> SellerCopilot:
    return SellerCopilot(_resolve_llm_provider())


async def get_seller_daily_brief(session: AsyncSession, owner_id: str) -> DailyBrief:
    context = await gather_seller_context(session, owner_id)
    return await _copilot().generate_daily_brief(session, context)


async def get_seller_insights(session: AsyncSession, owner_id: str) -> dict[str, Any]:
    context = await gather_seller_context(session, owner_id)
    insights = await _copilot().generate_insights(session, context)
    grouped = {"high": [], "medium": [], "low": []}
    for ins in insights:
        grouped[ins.priority].append(ins.model_dump())
    return {
        "insights": [i.model_dump() for i in insights],
        "grouped": grouped,
        "total": len(insights),
        "store_id": context.store_id,
    }


async def prepare_seller_action(
    session: AsyncSession,
    owner_id: str,
    *,
    action_type: str,
    insight_id: str | None = None,
    payload: dict | None = None,
) -> ActionPlan:
    context = await gather_seller_context(session, owner_id)
    return await _copilot().prepare_action(
        session,
        context,
        action_type=action_type,
        insight_id=insight_id,
        payload=payload,
    )
