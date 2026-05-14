from app.mobile_runtime.persistent_runtime_state import persistent_runtime_state_stub


def test_persistent_operational_fields() -> None:
    out = persistent_runtime_state_stub("r1")
    assert out["persistent_status"]["wal"] is True
    assert "lineage_persistence" in out
