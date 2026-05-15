"""runtime_canonical stub sweep."""
from __future__ import annotations

from app.runtime.runtime_canonical.canonical_execution_interface_v1 import canonical_execution_interface_v1_stub
from app.runtime.runtime_canonical.canonical_replay_interface_v1 import canonical_replay_interface_v1_stub


def test_runtime_canonical_sweep() -> None:
    p_canonical = canonical_execution_interface_v1_stub("ga30-sweep")
    assert p_canonical["runtime_confidence"] > 0
    p_canonical = canonical_replay_interface_v1_stub("ga30-sweep")
    assert p_canonical["runtime_confidence"] > 0
