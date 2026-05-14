from app.mobile_runtime.delta_sync_runtime import delta_sync_runtime_stub


def test_delta_sync_has_merge_hints() -> None:
    out = delta_sync_runtime_stub("c0")
    assert out["deterministic_merge_hints"]
