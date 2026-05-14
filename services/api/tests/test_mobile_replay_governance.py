from app.runtime.replay_governance_v2 import mobile_replay_bridge_stub


def test_mobile_replay_bridge() -> None:
    assert mobile_replay_bridge_stub("z")["chunk_streaming"] is True
