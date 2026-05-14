"""Tipos compartilhados do retrieval (judge-grade)."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any
from uuid import UUID


@dataclass
class ChunkHit:
    """Chunk após retrieval, expansão e ranking — usado pelo LLM e citações."""

    chunk_id: UUID
    document_id: UUID
    text: str
    rule_path: str | None
    semantic_path: str | None
    parent_chunk_id: UUID | None
    hierarchy_level: int
    document_title: str
    source_url: str
    content_sha256: str | None
    version_label: str | None
    document_content_hash: str | None
    metadata: dict[str, Any] = field(default_factory=dict)
    vector_score: float = 0.0
    bm25_score: float = 0.0
    fused_score: float = 0.0
    rerank_score: float | None = None
    temporal_score: float = 0.0
    expansion_source: str = "atomic"  # atomic | parent | sibling

    @property
    def effective_score(self) -> float:
        if self.rerank_score is not None:
            return float(self.rerank_score)
        return float(self.fused_score)
