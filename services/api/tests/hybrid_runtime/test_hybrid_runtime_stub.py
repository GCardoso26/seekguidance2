from app.mobile_runtime.runtime_modes import hybrid_runtime_mode_stub


def test_hybrid_mode() -> None:
    assert hybrid_runtime_mode_stub()["cloud_required"] is False
