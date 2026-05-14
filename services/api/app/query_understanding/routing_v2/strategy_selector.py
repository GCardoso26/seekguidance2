"""Seleção hierárquica de estratégia: intenção + complexidade + perfil do jogo."""

from __future__ import annotations

from app.context.temporal import TemporalHint
from app.games.types import GameSemanticPack
from app.query_understanding.decomposition import QueryDecomposition
from app.query_understanding.intent_classifier import QueryIntent
from app.query_understanding.routing_v2.intent_graphs import extra_heads_for_template, template_for_intent
from app.query_understanding.routing_v2.routing_profiles import RoutingStrategyV2, normalize_hybrid_weights
from app.query_understanding.semantic_router import RetrievalHint


def select_routing_strategy_v2(
    hint: RetrievalHint,
    decomposition: QueryDecomposition,
    temporal: TemporalHint,
    *,
    game_pack: GameSemanticPack,
) -> RoutingStrategyV2:
    """Define pesos e expansão sem quebrar o pipeline base (override suave)."""
    primary = hint.analysis.primary
    tpl = template_for_intent(primary, prefer_historical=bool(temporal.prefer_historical or temporal.as_of))
    labels = tuple(decomposition.sub_queries[:4]) if decomposition.sub_queries else (primary.value,)

    # Defaults alinhados ao motor híbrido existente
    vw, lw, rrf = 0.65, 0.35, 0.0
    g_scale = 1.0 * float(game_pack.graph_expansion_bias)
    rr_scale = 1.0
    edge_min: float | None = None

    qc = decomposition.complexity
    if primary == QueryIntent.timing:
        vw, lw = 0.55, 0.45
        g_scale *= 0.92
        rr_scale = 0.95
    elif primary == QueryIntent.replacement_effects or (
        primary == QueryIntent.gameplay_rules and qc > 0.55 and "replacement" in decomposition.original.lower()
    ):
        vw, lw = 0.72, 0.28
        g_scale *= 1.12
        rr_scale = 1.08
        edge_min = 0.38
    elif primary == QueryIntent.triggered_abilities:
        vw, lw = 0.68, 0.32
        g_scale *= 1.06
        rr_scale = 1.05
    elif primary in (QueryIntent.penalties, QueryIntent.tournament_policy):
        vw, lw = 0.48, 0.52
        g_scale *= 0.85
        edge_min = 0.42
    elif primary == QueryIntent.temporal_historical or temporal.prefer_historical:
        vw, lw = 0.58, 0.42
        g_scale *= 0.9

    if qc > 0.75:
        g_scale *= 1.05
        rr_scale *= 1.06
    elif qc < 0.35:
        g_scale *= 0.9

    vw, lw = normalize_hybrid_weights(vw, lw)

    return RoutingStrategyV2(
        profile_name=f"{game_pack.slug}:{primary.value}",
        reasoning_graph_template=tpl,
        vector_weight=vw,
        lexical_weight=lw,
        rrf_blend=rrf,
        graph_expansion_scale=max(0.72, min(1.28, g_scale)),
        rerank_pool_scale=max(0.75, min(1.2, rr_scale)),
        edge_min_relationship_score=edge_min,
        reasoning_path_labels=labels,
    )


def merge_graph_seeds_v2(
    decomposition_seeds: tuple[str, ...],
    strategy: RoutingStrategyV2,
) -> tuple[str, ...]:
    extra = extra_heads_for_template(strategy.reasoning_graph_template)
    merged: list[str] = []
    seen: set[str] = set()
    for s in (*decomposition_seeds, *extra):
        s = str(s).strip()
        if not s.isdigit() or s in seen:
            continue
        seen.add(s)
        merged.append(s)
    return tuple(merged[:18])
