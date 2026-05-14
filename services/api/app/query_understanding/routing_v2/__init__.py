"""Routing V2 — estratégias hierárquicas por intenção e por jogo."""

from app.query_understanding.routing_v2.reasoning_router import resolve_reasoning_route
from app.query_understanding.routing_v2.routing_profiles import RoutingStrategyV2

__all__ = ["RoutingStrategyV2", "resolve_reasoning_route"]
