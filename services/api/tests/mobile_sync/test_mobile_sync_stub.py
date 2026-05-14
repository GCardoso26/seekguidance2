from app.mobile_runtime.mobile_sync import incremental_sync_plan_stub


def test_incremental_sync() -> None:
    assert "replay_deltas" in incremental_sync_plan_stub(3)["priority"][0]
