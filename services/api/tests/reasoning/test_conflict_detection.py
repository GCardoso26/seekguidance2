"""Testes do detector de conflitos."""

from app.reasoning.conflicts.conflict_detector import detect_conflicts
from app.reasoning.execution.interaction_chain import dummy_hit


def test_replacement_sba_conflict_when_paths_present() -> None:
    q = "How do replacement effects interact with SBA during cleanup?"
    hits = [dummy_hit("614.1", "replacement"), dummy_hit("704.5", "state-based")]
    c = detect_conflicts(q, hits, game_slug="mtg")
    types = {x.type for x in c}
    assert "replacement_precedence" in types


def test_segoc_conflict_yugioh() -> None:
    q = "How does SEGOC ordering work in Yu-Gi-Oh?"
    hits = [dummy_hit("000", "chain")]
    c = detect_conflicts(q, hits, game_slug="yugioh")
    assert any(x.type == "mandatory_optional_timing" for x in c)
