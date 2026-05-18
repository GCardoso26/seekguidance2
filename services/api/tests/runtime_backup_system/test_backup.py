"""Backup tests."""
from app.runtime.runtime_backup_system.engine import runtime_backup_engine_v1
from app.runtime.runtime_restore_system.engine import runtime_restore_engine_v1


def test_backup_restore_roundtrip(tmp_path) -> None:
    r = runtime_backup_engine_v1("t", target_dir=str(tmp_path / "bak"))
    assert "backup_path" in r
    dry = runtime_restore_engine_v1("t", backup_path=r["backup_path"], dry_run=True)
    assert dry["would_restore"] is True
