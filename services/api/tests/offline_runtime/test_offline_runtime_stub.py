from app.mobile_runtime.offline import offline_replay_mode_stub


def test_offline_replay() -> None:
    assert offline_replay_mode_stub("b")["mode"] == "offline"
