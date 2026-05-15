from app.mobile_runtime import replay_delta_merge_v2_stub


def test_mobile_runtime_sync_v2() -> None:
    out = replay_delta_merge_v2_stub("d1")
    assert out["replay_summary"]["layer"] == "replay_delta_merge"
