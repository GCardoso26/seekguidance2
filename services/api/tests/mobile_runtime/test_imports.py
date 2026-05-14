from app.mobile_runtime import (
    hybrid_runtime_mode_stub,
    incremental_sync_runtime_stub,
    lightweight_reasoning_runtime_stub,
    lightweight_reasoning_stub,
    mobile_replay_chunk_stub,
)


def test_mobile_runtime_imports() -> None:
    assert hybrid_runtime_mode_stub()["mode"] == "hybrid"
    assert mobile_replay_chunk_stub("c1")["lazy"] is True
    assert lightweight_reasoning_stub("x")["depth_cap"] == 6
    sync = incremental_sync_runtime_stub(2)
    assert "deterministic_alignment" in sync
    lr = lightweight_reasoning_runtime_stub("y")
    assert lr["offline_confidence"] <= 1.0
