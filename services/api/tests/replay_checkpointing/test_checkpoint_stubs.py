"""Replay checkpoint stubs."""
from app.runtime.persistent_replay_runtime import replay_checkpoint_runtime_stub


def test_checkpoint_stub() -> None:
    p = replay_checkpoint_runtime_stub("ref-1")
    assert p["replay_checkpoint_summary"] is not None
