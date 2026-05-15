"""replay_integrity_v5."""
from __future__ import annotations

from app.runtime.persistent_replay_runtime.replay_hash_validation_runtime_v5 import (
    replay_hash_validation_runtime_v5_stub,
)


def test_replay_integrity_v5_payload() -> None:
    p = replay_hash_validation_runtime_v5_stub("ref")
    assert p["runtime_confidence"] > 0
    assert "assistant_notes" in p
