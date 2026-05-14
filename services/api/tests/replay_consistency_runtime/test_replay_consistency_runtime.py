from app.runtime.replay_governance_v2 import replay_consistency_runtime_stub


def test_replay_consistency_runtime() -> None:
    assert replay_consistency_runtime_stub(0.5)["replay_governance_alerts"] is True
