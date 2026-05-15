from app.mobile_runtime import replay_sync_conflicts_v2_stub


def test_mobile_sync_conflicts_stub() -> None:
    out = replay_sync_conflicts_v2_stub("peer-a")
    assert out["sync_hints"]
