"""Runtime alignment scoring."""
from app.runtime.runtime_alignment import replay_runtime_alignment_stub


def test_alignment_score() -> None:
    p = replay_runtime_alignment_stub("s1")
    assert p["replay_runtime_alignment_score"] > 0
