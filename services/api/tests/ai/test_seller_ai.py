"""Testes Seller AI Sprint 12."""

from app.ai.contracts.types import SellerContextBundle
from app.ai.prompts.registry import PROMPT_REGISTRY, render_prompt
from app.ai.providers.mock_provider import MockLlmProvider
from app.ai.tools.recommendation_builder import build_recommendations


def test_prompt_registry_has_daily_brief() -> None:
    assert "daily_brief_v1" in PROMPT_REGISTRY
    tpl = PROMPT_REGISTRY["daily_brief_v1"]
    assert tpl.version == "1.0.0"
    assert tpl.language == "pt-BR"


def test_render_prompt_requires_variables() -> None:
    text, tpl = render_prompt(
        "daily_brief_v1",
        {
            "greeting": "Bom dia",
            "opportunity_count": 3,
            "low_stock_count": 1,
            "missing_image_count": 2,
            "late_orders_count": 0,
            "open_tickets_count": 1,
            "reputation_delta": -2,
            "expected_payout_cents": 150000,
            "expected_payout_display": "1.500,00",
        },
    )
    assert "Bom dia" in text
    assert "3 oportunidades" in text
    assert tpl.id == "daily_brief_v1"


def test_build_recommendations_from_context() -> None:
    ctx = SellerContextBundle(
        store_id="store-1",
        owner_id="user-1",
        inventory={"low_stock_count": 3, "missing_image_count": 5, "paused_listings_count": 2},
        orders={"late_orders_count": 2, "to_separate": 4, "pending_payment": 1},
        pricing={"above_market_count": 4, "below_market_count": 0},
        tickets={"open_count": 1},
        finance={"chargebacks_open": 1},
        reputation={"score_delta": -3},
    )
    insights = build_recommendations(ctx)
    assert len(insights) >= 5
    assert insights[0].priority == "high"
    ids = {i.id for i in insights}
    assert "inv-low-stock" in ids
    assert "tix-open" in ids


async def test_mock_llm_provider_complete() -> None:
    provider = MockLlmProvider()
    result = await provider.complete(
        "daily_brief_v1",
        {
            "greeting": "Boa tarde",
            "opportunity_count": 2,
            "low_stock_count": 0,
            "missing_image_count": 0,
            "late_orders_count": 0,
            "open_tickets_count": 0,
            "reputation_delta": 0,
            "expected_payout_cents": 0,
            "expected_payout_display": "0,00",
        },
    )
    assert result.provider_id == "mock"
    assert "Boa tarde" in result.text
    assert result.latency_ms >= 0
