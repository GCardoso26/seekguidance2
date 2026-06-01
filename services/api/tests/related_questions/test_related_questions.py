"""Perguntas relacionadas heurísticas."""

from app.judge.related_questions import generate_related_questions


def test_trample_suggestions() -> None:
    qs = generate_related_questions("Como funciona Trample?", "mtg")
    assert len(qs) >= 2
    assert any("trample" in q.lower() or "double strike" in q.lower() for q in qs)


def test_yugioh_chain_fallback() -> None:
    qs = generate_related_questions("Como funciona a Chain?", "yugioh")
    assert len(qs) >= 2
