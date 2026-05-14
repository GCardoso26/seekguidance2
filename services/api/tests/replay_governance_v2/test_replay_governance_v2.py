from app.runtime.replay_governance_v2 import (
    mobile_replay_alignment_governance_stub,
    replay_consistency_runtime_stub,
)


def test_replay_governance_v2_stub() -> None:
    out = replay_consistency_runtime_stub(0.9)
    assert out["replay_consistency_scoring"] == 0.9


def test_mobile_replay_alignment_governance() -> None:
    out = mobile_replay_alignment_governance_stub("z")
    assert out["replay_summary"]["aligned"] is True