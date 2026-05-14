"""Testes: query understanding + context assembly."""

from __future__ import annotations

from uuid import uuid4

from app.context.assembler import ContextAssemblyEngine
from app.context.budgeting import build_budget, hierarchy_priority
from app.context.compressor import compress_preserving_legal_semantics, dedupe_lines
from app.context.hierarchy import group_hits_for_assembly
from app.context.temporal import TemporalHint, apply_temporal_ranking
from app.core.config import Settings
from app.query_understanding import classify_query, route_query
from app.query_understanding.intent_classifier import QueryIntent
from app.retrieval.types import ChunkHit


def _hit(**kwargs) -> ChunkHit:
    defaults = dict(
        chunk_id=uuid4(),
        document_id=uuid4(),
        text="603.1. Example rule text.",
        rule_path="603.1",
        semantic_path="603",
        parent_chunk_id=None,
        hierarchy_level=1,
        document_title="CR",
        source_url="https://x",
        content_sha256=None,
        version_label="2024",
        document_content_hash="h1",
        metadata={"doc_type": "cr"},
        fused_score=0.9,
        expansion_source="atomic",
    )
    defaults.update(kwargs)
    return ChunkHit(**defaults)


def test_classify_penalty_query() -> None:
    a = classify_query("What is the penalty for marked cards?")
    assert a.primary == QueryIntent.penalties


def test_route_penalty_prioritizes_ipg_mtr() -> None:
    h = route_query("marked cards infraction", prefer_historical=None)
    assert h.doc_types is not None
    assert "ipg" in h.doc_types


def test_route_priority_gameplay() -> None:
    h = route_query("How does priority work?", prefer_historical=None)
    assert h.doc_types is not None
    assert "cr" in h.doc_types


def test_hierarchy_bundle_groups() -> None:
    p = _hit(rule_path="603", expansion_source="parent", hierarchy_level=0, fused_score=0.7)
    a = _hit(rule_path="603.1", expansion_source="atomic", fused_score=0.95)
    s = _hit(rule_path="603.2", expansion_source="sibling", fused_score=0.5)
    b = group_hits_for_assembly([p, a, s])
    assert len(b.parents) == 1 and len(b.atomic) == 1 and len(b.siblings) == 1


def test_compress_preserves_exception_block() -> None:
    t = "Intro line.\n\nException: critical nuance must remain visible in tournaments."
    out = compress_preserving_legal_semantics(t, max_chars=80)
    assert "Exception" in out


def test_dedupe_lines() -> None:
    s = "alpha line one\nalpha line one\nbeta line two"
    assert dedupe_lines(s).count("alpha") == 1


def test_token_budget() -> None:
    b = build_budget(5000, reserved_answer=800)
    assert b.available_for_context == 4200


def test_assembler_smoke() -> None:
    settings = Settings(
        database_url="postgresql+asyncpg://x",
        redis_url="redis://x",
        context_token_budget_total=4000,
    )
    h = route_query("603 triggered abilities", prefer_historical=None)
    hits = [
        _hit(
            text="603. Triggered Abilities\n603.1. First.",
            rule_path="603",
            expansion_source="parent",
            hierarchy_level=0,
        ),
        _hit(text="603.3b. Nested.", rule_path="603.3b", expansion_source="atomic"),
    ]
    eng = ContextAssemblyEngine(settings)
    ap = eng.assemble(
        question="q",
        mode="judge",
        hits=hits,
        hint=h,
        temporal=TemporalHint(prefer_historical=False, as_of=None),
    )
    assert "Structured context" in ap.user_context_block
    assert "QUERY_INTENT" in ap.system_supplement
    assert ap.metrics["prompt_context_tokens_est"] > 0
    assert isinstance(ap.trace_blocks, list)
    assert len(ap.trace_blocks) >= 1


def test_temporal_ranking_orders_version() -> None:
    a = _hit(version_label="2024", fused_score=0.9, metadata={"chunk_created_at": "2024-01-01"})
    b = _hit(version_label="2010", fused_score=0.8, metadata={"chunk_created_at": "2010-01-01"})
    out = apply_temporal_ranking([a, b])
    assert out[0].version_label == "2010"


def test_hierarchy_priority_atomic_boost() -> None:
    a = _hit(expansion_source="atomic", fused_score=0.5)
    p = _hit(expansion_source="parent", fused_score=0.5)
    assert hierarchy_priority(a) > hierarchy_priority(p)
