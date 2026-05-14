from app.mobile_runtime.sqlite_runtime import sqlite_runtime_stub


def test_lineage_snapshot_in_storage() -> None:
    out = sqlite_runtime_stub("db")
    assert "lineage_snapshot" in out and out["offline_constraints"]
