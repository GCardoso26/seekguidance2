"""Recovery orchestrator v3."""

from __future__ import annotations

from pathlib import Path

from app.runtime.persistent_replay_runtime import replay_storage_recovery_orchestrator_v3_run


def test_recovery_orchestrator(tmp_path: Path) -> None:
    p = replay_storage_recovery_orchestrator_v3_run("ref-o", storage_path=str(tmp_path))
    assert p["recovery_confidence"] > 0
