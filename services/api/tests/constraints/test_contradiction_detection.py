"""Contradições em cadeias impossíveis."""

from app.reasoning.contradictions.contradiction_detector import detect_contradictions


def test_invalid_ordering_detected() -> None:
    bad = ["sba", "replacement", "event"]
    c = detect_contradictions(bad, "cleanup_step", "mtg")
    assert any(x["type"] == "ordering_violation" for x in c)
