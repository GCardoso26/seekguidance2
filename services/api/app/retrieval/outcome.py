"""Resultado agregado do retrieval (hits + telemetria explicável)."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any
from uuid import UUID

from app.query_understanding.decomposition import QueryDecomposition
from app.retrieval.confidence import ConfidenceSignals
from app.retrieval.types import ChunkHit


@dataclass
class RetrievalOutcome:
    hits: list[ChunkHit]
    confidence: float
    signals: ConfidenceSignals
    retrieval_reasons: list[str] = field(default_factory=list)
    decomposition: QueryDecomposition | None = None
    graph_expansion_limit_used: int = 0
    graph_expansion_candidates: int = 0
    debug: dict[str, Any] = field(default_factory=dict)
    query_id: UUID | None = None
    graph_edges_used: list[str] = field(default_factory=list)
    reasoning_path: list[str] = field(default_factory=list)
    graph_confidence: float = 0.0
    routing_profile: str = ""
    explainability: dict[str, Any] | None = None
