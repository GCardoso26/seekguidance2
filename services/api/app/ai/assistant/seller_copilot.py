"""SellerCopilot — implementação SellerAssistant."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.contracts.types import ActionPlan, ActionPlanItem, DailyBrief, SellerContextBundle, SellerInsight
from app.ai.observability.ai_telemetry import AiTelemetrySpan
from app.ai.providers.llm_provider import LlmProvider
from app.ai.tools.recommendation_builder import (
    brief_highlights,
    build_pricing_action_plan,
    build_recommendations,
)


def _greeting_for_hour(hour: int) -> str:
    if hour < 12:
        return "Bom dia"
    if hour < 18:
        return "Boa tarde"
    return "Boa noite"


def _cents_display(cents: int) -> str:
    return f"{cents / 100:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


class SellerCopilot:
    def __init__(self, llm: LlmProvider) -> None:
        self._llm = llm

    async def generate_daily_brief(
        self,
        session: AsyncSession,
        context: SellerContextBundle,
    ) -> DailyBrief:
        insights = await self.generate_insights(session, context)
        hour = datetime.now(UTC).hour
        greeting = _greeting_for_hour(hour)
        payout = int(context.finance.get("expected_payout_cents") or 0)

        variables = {
            "greeting": greeting,
            "opportunity_count": len(insights),
            "low_stock_count": int(context.inventory.get("low_stock_count") or 0),
            "missing_image_count": int(context.inventory.get("missing_image_count") or 0),
            "late_orders_count": int(context.orders.get("late_orders_count") or 0),
            "open_tickets_count": int(context.tickets.get("open_count") or 0),
            "reputation_delta": float(context.reputation.get("score_delta") or 0),
            "expected_payout_cents": payout,
            "expected_payout_display": _cents_display(payout),
        }

        with AiTelemetrySpan(
            event_type="daily_brief",
            provider_id=self._llm.provider_id,
            prompt_id="daily_brief_v1",
            prompt_version="1.0.0",
            store_id=context.store_id,
        ) as span:
            result = await self._llm.complete("daily_brief_v1", variables)
            span.set_tokens(result.input_tokens, result.output_tokens, result.estimated_cost_usd)

        return DailyBrief(
            greeting=greeting,
            summary=result.text,
            opportunity_count=len(insights),
            highlights=brief_highlights(context, insights),
            metrics={
                "revenue_today_cents": int(context.orders.get("revenue_today_cents") or 0),
                "pending_orders": int(context.orders.get("to_separate") or 0),
                "open_tickets": int(context.tickets.get("open_count") or 0),
                "trust_score": float(context.reputation.get("trust_score") or 0),
                "chargebacks_open": int(context.finance.get("chargebacks_open") or 0),
            },
            top_insights=insights[:3],
            generated_at=datetime.now(UTC).isoformat(),
        )

    async def generate_insights(
        self,
        session: AsyncSession,
        context: SellerContextBundle,
    ) -> list[SellerInsight]:
        _ = session
        return build_recommendations(context)

    async def prepare_action(
        self,
        session: AsyncSession,
        context: SellerContextBundle,
        *,
        action_type: str,
        insight_id: str | None = None,
        payload: dict | None = None,
    ) -> ActionPlan:
        _ = session
        _ = payload
        if action_type == "bulk_price_update" or insight_id in ("price-above", "price-below"):
            raw = build_pricing_action_plan(context, insight_id)
            return ActionPlan(
                action_type=raw["action_type"],
                title=raw["title"],
                description=raw["description"],
                items=[ActionPlanItem(**item) for item in raw["items"]],
                requires_confirmation=True,
                execute_endpoint=raw.get("execute_endpoint"),
                execute_method=raw.get("execute_method", "PATCH"),
            )
        raise ValueError(f"Ação não suportada: {action_type}")
