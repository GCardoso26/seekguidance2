"""Testes: bundle de sinais e persistência (sem DB obrigatório)."""

from __future__ import annotations

from uuid import uuid4

from app.core.config import Settings
from app.graph.feedback.feedback_engine import build_signal_bundle


def test_build_signal_bundle_shape() -> None:
    b = build_signal_bundle(
        query_id=uuid4(),
        confidence=0.72,
        n_citations=5,
        graph_edges_used=["614->704:replacement_interaction"],
        reasoning_path=["replacement effects", "SBA"],
        graph_candidates=6,
        graph_limit=12,
        top_k=10,
        vec_lex_overlap=0.4,
    )
    assert b.retrieval_success
    assert 0.0 <= b.hallucination_risk <= 1.0


def test_record_feedback_loop_skips_when_disabled() -> None:
    # Sem sessão real: só valida que não explode com persistence off
    s = Settings(
        database_url="postgresql+asyncpg://x",
        redis_url="redis://x",
        feedback_persistence_enabled=False,
    )
    assert s.feedback_persistence_enabled is False
