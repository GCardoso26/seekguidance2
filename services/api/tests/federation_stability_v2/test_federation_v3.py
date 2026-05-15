"""Federation stability v2."""

from __future__ import annotations

from app.runtime.replay_federation import federation_consensus_runtime_v3_stub


def test_federation_consensus_v3() -> None:
    p = federation_consensus_runtime_v3_stub("fed-v3")
    assert p["federation_health_score"] > 0
