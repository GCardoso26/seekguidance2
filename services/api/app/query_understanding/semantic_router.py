"""Routing semântico: famílias de documento + flags temporais para o retrieval."""

from __future__ import annotations

from dataclasses import dataclass

from app.query_understanding.intent_classifier import QueryAnalysis, QueryIntent, classify_query
from app.query_understanding.query_expansion import expand_lexical_query


@dataclass(frozen=True)
class RetrievalHint:
    """Sinais consumidos pelo `RetrievalPipeline` e pelo context assembler."""

    analysis: QueryAnalysis
    doc_types: tuple[str, ...] | None
    lexical_query: str
    prefer_historical: bool


def _doc_types_for_intent(primary: QueryIntent) -> tuple[str, ...] | None:
    """Prioriza subconjuntos de `documents.doc_type` (ingestão deve usar estes slugs)."""
    if primary == QueryIntent.temporal_historical:
        return ("cr", "release_notes")
    if primary in (QueryIntent.penalties,):
        return ("ipg", "mtr")
    if primary in (QueryIntent.tournament_policy, QueryIntent.tournament_procedures):
        return ("mtr", "ipg")
    if primary in (
        QueryIntent.gameplay_rules,
        QueryIntent.timing,
        QueryIntent.replacement_effects,
        QueryIntent.triggered_abilities,
        QueryIntent.layers,
        QueryIntent.combat,
        QueryIntent.unknown,
    ):
        return ("cr", "release_notes")
    if primary == QueryIntent.deck_legality:
        return ("mtr", "cr")
    return None


def route_query(
    question: str,
    *,
    prefer_historical: bool | None = None,
) -> RetrievalHint:
    analysis = classify_query(question)
    hist = bool(prefer_historical) or analysis.primary == QueryIntent.temporal_historical
    doc_types = _doc_types_for_intent(analysis.primary)
    if hist and doc_types and "release_notes" not in doc_types:
        doc_types = tuple(dict.fromkeys((*doc_types, "release_notes")))
    lex = expand_lexical_query(question, analysis.primary)
    return RetrievalHint(
        analysis=analysis,
        doc_types=doc_types,
        lexical_query=lex,
        prefer_historical=hist,
    )
