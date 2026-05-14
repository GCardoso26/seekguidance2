from app.runtime.production_runtime import (
    runtime_consensus_engine_stub,
    runtime_snapshot_governance_stub,
)


def test_runtime_consensus_engine() -> None:
    out = runtime_consensus_engine_stub("q1")
    assert out["governance"] == "production_runtime_v3_stub"


def test_snapshot_governance() -> None:
    out = runtime_snapshot_governance_stub("snap-1")
    assert out["cluster"] == "snap-1"
