"""Testes: camada de explicação do retrieval."""

from __future__ import annotations

from uuid import uuid4

from app.query_understanding.decomposition import QueryDecomposition
from app.retrieval.explanations import build_retrieval_explanations
from app.retrieval.types import ChunkHit


def _hit(rule_path: str) -> ChunkHit:
    return ChunkHit(
        chunk_id=uuid4(),
        document_id=uuid4(),
        text="603.2a example",
        rule_path=rule_path,
        semantic_path="603",
        parent_chunk_id=None,
        hierarchy_level=1,
        document_title="CR",
        source_url="https://x",
        content_sha256=None,
        version_label=None,
        document_content_hash=None,
        fused_score=0.8,
    )


def test_build_retrieval_explanations_non_empty() -> None:
    q = "How does priority interact with triggered abilities?"
    hits = [_hit("603.1")]
    d = QueryDecomposition(
        original=q,
        sub_queries=("priority window", "triggered abilities"),
        graph_seeds=("117", "603"),
        lexical_augmentation="priority triggered",
        complexity=0.7,
    )
    reasons = build_retrieval_explanations(
        q,
        hits,
        confidence=0.55,
        decomposition=d,
        graph_expansion_n=4,
        temporal_score_mean=0.5,
    )
    assert isinstance(reasons, list)
    assert len(reasons) >= 1
