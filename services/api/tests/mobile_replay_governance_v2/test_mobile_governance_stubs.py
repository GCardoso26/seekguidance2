from app.runtime.replay_governance_v2 import (
    mobile_replay_alignment_governance_stub,
    mobile_snapshot_reconciliation_stub,
)


def test_mobile_replay_governance_extensions() -> None:
    a = mobile_replay_alignment_governance_stub("s1")
    assert a["deterministic_alignment"]["token"] == "mrag-s1"
    b = mobile_snapshot_reconciliation_stub("x", "y")
    assert "assistant_notes" in b
