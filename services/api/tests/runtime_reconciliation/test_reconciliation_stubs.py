from app.runtime.replay_governance_v2 import (
    cross_device_replay_merge_stub,
    distributed_replay_reconciliation_stub,
    replay_temporal_reconciliation_stub,
)


def test_distributed_reconciliation_payload() -> None:
    out = distributed_replay_reconciliation_stub("rid-1")
    assert out["replay_summary"]["status"] == "reconciled_stub"
    assert out["replay_confidence"] > 0


def test_cross_device_merge() -> None:
    out = cross_device_replay_merge_stub("merge-1")
    assert out["replay_consensus_summary"]["agreed"] is True


def test_temporal_reconciliation() -> None:
    out = replay_temporal_reconciliation_stub("t0")
    assert out["replay_summary"]["layer"] == "replay_temporal_reconciliation"
