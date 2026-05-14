"""Regras leves de bias por intenção (MTG)."""

from app.query_understanding.intent_classifier import QueryIntent


def expansion_bias_for_intent(primary: QueryIntent) -> float:
    if primary in (QueryIntent.replacement_effects, QueryIntent.triggered_abilities):
        return 1.08
    if primary == QueryIntent.timing:
        return 0.94
    if primary in (QueryIntent.penalties, QueryIntent.tournament_policy):
        return 0.88
    return 1.0
