"""Snapshots / histórico."""

from app.reasoning.snapshots.transition_history import TransitionHistory


def test_history_cap() -> None:
    h = TransitionHistory()
    for i in range(100):
        h.append({"i": i})
    assert len(h.as_list()) <= 64
