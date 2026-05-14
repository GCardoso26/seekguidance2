from app.runtime.replay_governance_v2 import replay_consistency_runtime_stub


def test_replay_governance_v2_stub() -> None:
    out = replay_consistency_runtime_stub(0.9)
    assert out["replay_consistency_scoring"] == 0.9
