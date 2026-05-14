"""Entrada única para routing V2 (facilita imports no pipeline)."""

from __future__ import annotations

from app.context.temporal import TemporalHint
from app.games.registry import get_game_pack
from app.query_understanding.decomposition import QueryDecomposition
from app.query_understanding.routing_v2.routing_profiles import RoutingStrategyV2
from app.query_understanding.routing_v2.strategy_selector import merge_graph_seeds_v2, select_routing_strategy_v2
from app.query_understanding.semantic_router import RetrievalHint


def resolve_reasoning_route(
    hint: RetrievalHint,
    decomposition: QueryDecomposition,
    temporal: TemporalHint,
    *,
    game_slug: str,
) -> tuple[RoutingStrategyV2, tuple[str, ...]]:
    pack = get_game_pack(game_slug)
    strategy = select_routing_strategy_v2(hint, decomposition, temporal, game_pack=pack)
    seeds = merge_graph_seeds_v2(decomposition.graph_seeds, strategy)
    return strategy, seeds
