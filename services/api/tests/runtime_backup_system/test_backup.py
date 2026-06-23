"""Backup tests."""

import shutil
from pathlib import Path

from app.runtime.runtime_backup_system.engine import runtime_backup_engine_v1
from app.runtime.runtime_restore_system.engine import runtime_restore_engine_v1

_BACKUP_ROOT = Path("generated/runtime_artifacts/runtime_backup_v1")


def test_backup_restore_roundtrip() -> None:
    _BACKUP_ROOT.mkdir(parents=True, exist_ok=True)
    target = _BACKUP_ROOT / "pytest-roundtrip"
    if target.exists():
        shutil.rmtree(target)

    r = runtime_backup_engine_v1("t", target_dir=str(target))
    assert "backup_path" in r
    dry = runtime_restore_engine_v1("t", backup_path=r["backup_path"], dry_run=True)
    assert dry.get("would_restore") is True
