"""Compat: retrieval híbrido exposto historicamente neste módulo."""

from __future__ import annotations

from app.retrieval.outcome import RetrievalOutcome
from app.retrieval.pipeline import HybridRetriever, RetrievalPipeline
from app.retrieval.sql_retrieval import search_lexical_hits, search_vector_hits, vec_literal

__all__ = [
    "HybridRetriever",
    "RetrievalOutcome",
    "RetrievalPipeline",
    "vec_literal",
    "search_vector_hits",
    "search_lexical_hits",
]
