"""Temporal SQL, scoring composto e utilitários do grafo de regras."""

from __future__ import annotations

from datetime import date
from uuid import uuid4

from app.context.temporal import TemporalHint
from app.core.config import Settings
from app.graph.semantic_links import neighbor_heads_for_paths, rule_numeric_head
from app.retrieval.temporal_scoring import composite_retrieval_score, compute_temporal_score
from app.retrieval.temporal_sql import parse_as_of_date, temporal_sql_filter
from app.retrieval.types import ChunkHit


def _settings() -> Settings:
    return Settings(database_url="postgresql+asyncpg://x", redis_url="redis://x")


def _hit(**kwargs: object) -> ChunkHit:
    defaults: dict = dict(
        chunk_id=uuid4(),
        document_id=uuid4(),
        text="603.3b Example.",
        rule_path="603.3b",
        semantic_path="603",
        parent_chunk_id=None,
        hierarchy_level=2,
        document_title="CR",
        source_url="https://x",
        content_sha256=None,
        version_label="2010",
        document_content_hash="h1",
        metadata={
            "version_effective_from": "2010-07-16",
            "version_effective_to": "2013-07-13",
        },
        fused_score=0.8,
        rerank_score=None,
        temporal_score=0.0,
        expansion_source="atomic",
    )
    defaults.update(kwargs)
    return ChunkHit(**defaults)


def test_parse_as_of_date() -> None:
    assert parse_as_of_date("2020-01-15") == date(2020, 1, 15)
    assert parse_as_of_date("bad") is None


def test_temporal_sql_filter_as_of_params() -> None:
    clause, params = temporal_sql_filter(as_of="2012-06-01", prefer_historical=False)
    assert ":as_of" in clause
    assert params["as_of"] == "2012-06-01"
    assert "effective_from" in clause and "effective_to" in clause


def test_temporal_sql_filter_prefer_historical() -> None:
    clause, params = temporal_sql_filter(as_of=None, prefer_historical=True)
    assert "effective_to IS NOT NULL" in clause
    assert params == {}


def test_compute_temporal_score_as_of_window() -> None:
    s = _settings()
    h = _hit(
        metadata={
            "version_effective_from": "2010-07-16",
            "version_effective_to": "2013-07-13",
        }
    )
    th = TemporalHint(prefer_historical=False, as_of="2012-01-01")
    score = compute_temporal_score(h, th, s)
    assert score >= 0.5


def test_composite_retrieval_score_weighted_mean() -> None:
    s = _settings()
    h = _hit(fused_score=0.5, temporal_score=1.0, rerank_score=None)
    c = composite_retrieval_score(h, s)
    denom = s.score_weight_hybrid + s.score_weight_temporal + s.score_weight_rerank
    expected = (s.score_weight_hybrid * 0.5 + s.score_weight_temporal * 1.0 + s.score_weight_rerank * 0.5) / denom
    assert abs(c - expected) < 1e-6


def test_rule_numeric_head() -> None:
    assert rule_numeric_head("614.12a") == "614"
    assert rule_numeric_head(None) is None


def test_neighbor_heads_for_paths() -> None:
    heads = neighbor_heads_for_paths(["614.12", "603.1"])
    assert "704" in heads
    assert "117" in heads
