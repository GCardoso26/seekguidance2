"""Templates de leitura (grafos de raciocínio) por família de pergunta — gameplay, não jurídico."""

from __future__ import annotations

from app.games.mtg.reasoning_profiles import (
    INTERACTION_REASONING_GRAPH,
    STACK_RESOLUTION_GRAPH,
    TIMING_REASONING_GRAPH,
    TOURNAMENT_POLICY_GRAPH,
)
from app.query_understanding.intent_classifier import QueryIntent

# Cabeçalhos numéricos adicionais sugeridos por template (CR MTG; outros TCGs ignoram no SQL)
TEMPLATE_EXTRA_HEADS: dict[str, tuple[str, ...]] = {
    TIMING_REASONING_GRAPH: ("117", "500", "305", "405"),
    INTERACTION_REASONING_GRAPH: ("614", "704", "117", "603"),
    STACK_RESOLUTION_GRAPH: ("405", "117", "500", "514"),
    TOURNAMENT_POLICY_GRAPH: ("100", "400"),
    "temporal_historical_graph": ("105", "614", "704"),
    "combat_reasoning_graph": ("506", "510", "514"),
    "replacement_effect_graph": ("614", "704", "122", "306"),
    "triggered_ability_graph": ("603", "405", "117"),
}


def template_for_intent(primary: QueryIntent, *, prefer_historical: bool) -> str:
    if prefer_historical or primary == QueryIntent.temporal_historical:
        return "temporal_historical_graph"
    if primary == QueryIntent.timing:
        return TIMING_REASONING_GRAPH
    if primary == QueryIntent.replacement_effects:
        return "replacement_effect_graph"
    if primary == QueryIntent.triggered_abilities:
        return "triggered_ability_graph"
    if primary == QueryIntent.combat:
        return "combat_reasoning_graph"
    if primary in (QueryIntent.penalties, QueryIntent.tournament_policy, QueryIntent.tournament_procedures):
        return TOURNAMENT_POLICY_GRAPH
    if primary == QueryIntent.layers:
        return INTERACTION_REASONING_GRAPH
    return INTERACTION_REASONING_GRAPH


def extra_heads_for_template(template: str) -> tuple[str, ...]:
    return TEMPLATE_EXTRA_HEADS.get(template, ())
