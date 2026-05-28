"""Testes unitários: fusão híbrida, diversificação, dedup, confiança."""

from __future__ import annotations

from uuid import uuid4

from app.retrieval.confidence import ConfidenceSignals, compute_confidence, vec_lex_agreement
from app.retrieval.confidence_profiles import get_confidence_profile
from app.retrieval.deduplication import deduplicate_by_embedding
from app.retrieval.diversification import diversify_hits, rule_chapter
from app.retrieval.fusion import cosine_distance_to_similarity, merge_rrf_and_weighted, weighted_hybrid_scores
from app.retrieval.types import ChunkHit


def test_cosine_distance_to_similarity() -> None:
    assert cosine_distance_to_similarity(0.0) == 1.0
    assert cosine_distance_to_similarity(2.0) == 0.0


def test_weighted_hybrid_partial_branch() -> None:
    u1, u2 = uuid4(), uuid4()
    v = {u1: 1.0, u2: 0.5}
    lex = {u1: 0.2, u2: 0.8}
    fused = weighted_hybrid_scores(
        vector_scores=v,
        lexical_scores=lex,
        vector_weight=0.65,
        lexical_weight=0.35,
    )
    assert abs(fused[u1] - (0.65 * 1.0 + 0.35 * 0.2)) < 1e-6
    assert abs(fused[u2] - (0.65 * 0.5 + 0.35 * 0.8)) < 1e-6


def test_merge_rrf_blend() -> None:
    a, b, c = uuid4(), uuid4(), uuid4()
    vec_ids = [a, b]
    lex_ids = [b, c]
    v = {a: 1.0, b: 0.5, c: 0.0}
    lex = {a: 0.0, b: 0.7, c: 0.9}
    m = merge_rrf_and_weighted(
        vec_ids=vec_ids,
        lex_ids=lex_ids,
        vector_scores=v,
        lexical_scores=lex,
        vector_weight=0.65,
        lexical_weight=0.35,
        rrf_blend=1.0,
    )
    assert b in m and m[b] > 0


def test_rule_chapter() -> None:
    assert rule_chapter("603.3b") == "603"
    assert rule_chapter(None) is None


def test_diversify_per_chapter() -> None:
    d = uuid4()
    hits = [
        _hit("603.1", 0.9, d),
        _hit("603.2", 0.88, d),
        _hit("603.3", 0.87, d),
        _hit("603.4", 0.86, d),
        _hit("104.1", 0.5, d),
    ]
    div = diversify_hits(hits, max_total=4, max_per_chapter=2, max_per_document=8)
    n603 = sum(1 for h in div if h.rule_path and h.rule_path.startswith("603"))
    assert n603 <= 2
    assert len(div) == 3


def test_dedup_embeddings() -> None:
    u1, u2, u3 = uuid4(), uuid4(), uuid4()
    emb = [1.0, 0.0, 0.0]
    hits = [
        ChunkHit(
            chunk_id=u1,
            document_id=uuid4(),
            text="a",
            rule_path=None,
            semantic_path=None,
            parent_chunk_id=None,
            hierarchy_level=0,
            document_title="t",
            source_url="u",
            content_sha256=None,
            version_label=None,
            document_content_hash=None,
            fused_score=1.0,
        ),
        ChunkHit(
            chunk_id=u2,
            document_id=uuid4(),
            text="b",
            rule_path=None,
            semantic_path=None,
            parent_chunk_id=None,
            hierarchy_level=0,
            document_title="t",
            source_url="u",
            content_sha256=None,
            version_label=None,
            document_content_hash=None,
            fused_score=0.9,
        ),
        ChunkHit(
            chunk_id=u3,
            document_id=uuid4(),
            text="c",
            rule_path=None,
            semantic_path=None,
            parent_chunk_id=None,
            hierarchy_level=0,
            document_title="t",
            source_url="u",
            content_sha256=None,
            version_label=None,
            document_content_hash=None,
            fused_score=0.8,
        ),
    ]
    embs = {u1: emb, u2: emb, u3: [0.0, 1.0, 0.0]}
    out = deduplicate_by_embedding(hits, embs, threshold=0.99)
    assert len(out) == 2


def test_vec_lex_agreement() -> None:
    a, b, c = uuid4(), uuid4(), uuid4()
    assert vec_lex_agreement([a, b, c], [b, c, a], k=3) == 1.0


def test_compute_confidence_not_constant() -> None:
    profile = get_confidence_profile("mtg")
    low = ConfidenceSignals(
        mean_fused=0.1,
        top1_fused=0.1,
        mean_rerank=None,
        top1_rerank=None,
        vec_lex_overlap=0.0,
        score_spread=0.05,
        n_sources=1,
        n_rule_sources=1,
        n_chunks=2,
        n_expansion_parents=1,
    )
    high = ConfidenceSignals(
        mean_fused=0.85,
        top1_fused=0.92,
        mean_rerank=0.9,
        top1_rerank=0.95,
        vec_lex_overlap=0.8,
        score_spread=0.4,
        n_sources=3,
        n_rule_sources=5,
        n_chunks=5,
        n_expansion_parents=1,
    )
    assert compute_confidence(high, profile) > compute_confidence(low, profile)


def _hit(rule: str, score: float, doc_id) -> ChunkHit:
    return ChunkHit(
        chunk_id=uuid4(),
        document_id=doc_id,
        text="x",
        rule_path=rule,
        semantic_path=None,
        parent_chunk_id=None,
        hierarchy_level=1,
        document_title="CR",
        source_url="https://example.invalid",
        content_sha256=None,
        version_label="v1",
        document_content_hash="abc",
        fused_score=score,
    )
