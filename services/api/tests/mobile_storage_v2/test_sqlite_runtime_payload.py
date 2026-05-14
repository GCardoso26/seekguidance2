from app.mobile_runtime.sqlite_runtime import sqlite_runtime_stub


def test_sqlite_storage_payload() -> None:
    out = sqlite_runtime_stub("/data/replay.db")
    assert out["storage_status"]["writable"] is True
    assert "lineage_snapshot" in out
