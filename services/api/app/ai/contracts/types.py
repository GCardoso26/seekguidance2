"""Contratos do Seller AI — sem regras de negócio."""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field

InsightPriority = Literal["high", "medium", "low"]
InsightCategory = Literal[
    "pricing",
    "inventory",
    "orders",
    "tickets",
    "reputation",
    "finance",
    "analytics",
]


class SellerInsight(BaseModel):
    id: str
    category: InsightCategory
    priority: InsightPriority
    title: str
    description: str
    reason: str
    impact: str
    cta_label: str
    cta_href: str
    metric_value: int | float | None = None
    prepared_action_type: str | None = None
    prepared_action_payload: dict[str, Any] = Field(default_factory=dict)


class DailyBrief(BaseModel):
    greeting: str
    summary: str
    opportunity_count: int
    highlights: list[str]
    metrics: dict[str, Any] = Field(default_factory=dict)
    top_insights: list[SellerInsight] = Field(default_factory=list)
    generated_at: str


class ActionPlanItem(BaseModel):
    resource_type: str
    resource_id: str
    field: str
    current_value: Any
    proposed_value: Any
    label: str


class ActionPlan(BaseModel):
    action_type: str
    title: str
    description: str
    items: list[ActionPlanItem]
    requires_confirmation: bool = True
    execute_endpoint: str | None = None
    execute_method: str = "PATCH"


class SellerContextBundle(BaseModel):
    store_id: str
    owner_id: str
    analytics: dict[str, Any] = Field(default_factory=dict)
    orders: dict[str, Any] = Field(default_factory=dict)
    pricing: dict[str, Any] = Field(default_factory=dict)
    inventory: dict[str, Any] = Field(default_factory=dict)
    finance: dict[str, Any] = Field(default_factory=dict)
    reputation: dict[str, Any] = Field(default_factory=dict)
    tickets: dict[str, Any] = Field(default_factory=dict)
