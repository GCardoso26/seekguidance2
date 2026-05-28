"""Testes de perfis e fórmula de confiança por jogo."""

from __future__ import annotations

from uuid import uuid4

from app.retrieval.confidence import ConfidenceSignals, compute_confidence, count_distinct_rule_sources
from app.retrieval.confidence_profiles import get_confidence_profile
from app.retrieval.types import ChunkHit


def test_mtg_profile_higher_than_default_on_typical_signals() -> None:
    sig = ConfidenceSignals(
        mean_fused=0.42,
        top1_fused=0.68,
        mean_rerank=None,
        top1_rerank=None,
        vec_lex_overlap=0.12,
        score_spread=0.22,
        n_sources=1,
        n_rule_sources=4,
        n_chunks=8,
        n_expansion_parents=3,
    )
    default = compute_confidence(sig, get_confidence_profile("digimon"))
    mtg = compute_confidence(sig, get_confidence_profile("mtg"))
    assert mtg > default


def test_top1_fused_boosts_score() -> None:
    base = ConfidenceSignals(
        mean_fused=0.35,
        top1_fused=0.35,
        mean_rerank=None,
        top1_rerank=None,
        vec_lex_overlap=0.2,
        score_spread=0.15,
        n_sources=2,
        n_rule_sources=2,
        n_chunks=5,
        n_expansion_parents=1,
    )
    boosted = ConfidenceSignals(
        **{**base.__dict__, "top1_fused": 0.82},
    )
    assert compute_confidence(boosted, get_confidence_profile("mtg")) > compute_confidence(
        base, get_confidence_profile("mtg")
    )


def test_rule_path_source_count() -> None:
    doc = uuid4()
    hits = [
        ChunkHit(
            chunk_id=uuid4(),
            document_id=doc,
            text="a",
            rule_path="702.19",
            semantic_path=None,
            parent_chunk_id=None,
            hierarchy_level=0,
            document_title="CR",
            source_url="",
            content_sha256=None,
            version_label=None,
            document_content_hash=None,
        ),
        ChunkHit(
            chunk_id=uuid4(),
            document_id=doc,
            text="b",
            rule_path="603.6",
            semantic_path=None,
            parent_chunk_id=None,
            hierarchy_level=0,
            document_title="CR",
            source_url="",
            content_sha256=None,
            version_label=None,
            document_content_hash=None,
        ),
    ]
    assert count_distinct_rule_sources(hits) == 2


def test_ui_threshold_per_game() -> None:
    assert get_confidence_profile("mtg").ui_notice_threshold == 0.40
    assert get_confidence_profile("unknown").ui_notice_threshold == 0.42
