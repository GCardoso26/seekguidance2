"""Testes de timing."""

from app.reasoning.simulation.timing_windows import infer_timing


def test_cleanup_window_mtg() -> None:
    t = infer_timing("During cleanup step and SBA", "mtg")
    assert t["window"] == "cleanup_step"
