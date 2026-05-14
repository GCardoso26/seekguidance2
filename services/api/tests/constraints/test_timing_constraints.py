"""Regras de timing formalizadas."""

from app.reasoning.constraints.timing_constraints import timing_requires_for_window
from app.reasoning.contradictions.timing_conflict_detector import detect_timing_conflicts


def test_cleanup_requires_sba() -> None:
    req = timing_requires_for_window("mtg", "cleanup_step")
    assert "sba" in req


def test_timing_conflict_when_missing_role() -> None:
    c = detect_timing_conflicts("cleanup_step", {"event", "replacement"}, "mtg")
    assert any(x["type"] == "timing_requirement_unmet" for x in c)
