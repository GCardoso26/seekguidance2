"""Testes: routing V2."""

from __future__ import annotations

from app.context.temporal import TemporalHint
from app.query_understanding import route_query
from app.query_understanding.decomposition import decompose_query
from app.query_understanding.routing_v2 import resolve_reasoning_route


def test_resolve_reasoning_route_priority() -> None:
    q = "How does priority work?"
    hint = route_query(q, prefer_historical=None)
    d = decompose_query(q, hint)
    strat, seeds = resolve_reasoning_route(hint, d, TemporalHint(False), game_slug="mtg")
    assert strat.vector_weight > 0.4
    assert len(seeds) >= 1


def test_resolve_reasoning_route_replacement() -> None:
    q = "How do replacement effects interact with SBA?"
    hint = route_query(q, prefer_historical=None)
    d = decompose_query(q, hint)
    strat, seeds = resolve_reasoning_route(hint, d, TemporalHint(False), game_slug="mtg")
    assert strat.profile_name.startswith("mtg:")
    assert len(seeds) >= 1
