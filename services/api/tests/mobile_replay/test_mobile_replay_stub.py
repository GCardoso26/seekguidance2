from app.mobile_runtime.replay import mobile_replay_chunk_stub


def test_replay_chunk() -> None:
    assert mobile_replay_chunk_stub("x")["chunk_id"] == "x"
