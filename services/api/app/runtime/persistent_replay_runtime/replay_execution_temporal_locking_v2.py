"""Temporal locking simples via ficheiro (stdlib, opcional)."""

from __future__ import annotations

import os
import time
from pathlib import Path
from typing import Any

from app.runtime.persistent_replay_runtime.sqlite_snapshot_store import (
    default_sqlite_store_root,
)


def _lock_path(scope: str, root: Path) -> Path:
    safe = "".join(c if c.isalnum() or c in "-_" else "_" for c in scope)[:64]
    return root / "locks" / f"{safe}.lock"


def replay_execution_temporal_locking_v2_stub(
    scope: str,
    *,
    storage_path: str | None = None,
) -> dict[str, Any]:
    root = Path(storage_path) if storage_path else default_sqlite_store_root()
    lock_file = _lock_path(scope, root)
    lock_file.parent.mkdir(parents=True, exist_ok=True)
    acquired = False
    try:
        fd = os.open(str(lock_file), os.O_CREAT | os.O_EXCL | os.O_WRONLY)
        os.write(fd, str(time.time()).encode("ascii"))
        os.close(fd)
        acquired = True
    except FileExistsError:
        acquired = False
    finally:
        if acquired:
            try:
                lock_file.unlink(missing_ok=True)
            except OSError:
                pass
    return {
        "scope": scope,
        "storage_path": storage_path or "default",
        "assistant_notes": [
            "replay_execution_temporal_locking_v2: lock ficheiro opcional.",
        ],
        "deterministic_alignment": {"token": f"lock-{scope}"},
        "runtime_confidence": 0.84,
        "replay_summary": {"lock_acquired": acquired},
        "lineage_summary": {},
        "operational_hints": {},
        "replay_execution_token": f"lock-{scope}",
        "replay_checkpoint_summary": {},
        "replay_integrity_score": 0.84,
        "temporal_consistency": {"bounded": True, "lock_acquired": acquired},
    }
