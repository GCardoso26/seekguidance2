from app.runtime.replay_governance_v2 import replay_consensus_runtime_stub


def test_replay_consensus_runtime() -> None:
    out = replay_consensus_runtime_stub("c1")
    assert out["replay_confidence"] > 0.0
