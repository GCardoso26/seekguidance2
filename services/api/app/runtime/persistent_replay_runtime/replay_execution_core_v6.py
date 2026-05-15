"""Core determinístico de replay (stdlib, opcional SQLite/fs)."""

from __future__ import annotations

import hashlib
import json
import os
import time
from collections.abc import Mapping
from pathlib import Path
from typing import Any

from app.runtime.persistent_replay_runtime.sqlite_checkpoint_runtime import sqlite_checkpoint_runtime_write
from app.runtime.persistent_replay_runtime.sqlite_snapshot_store import (
    default_sqlite_store_root,
    sqlite_read_latest_snapshot,
    sqlite_write_snapshot,
)


def _replay_token(replay_ref: str, payload: Mapping[str, Any]) -> str:
    raw = json.dumps({"replay_ref": replay_ref, "payload": dict(payload)}, sort_keys=True)
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()[:24]


def append_replay_execution_journal(
    replay_ref: str,
    event: str,
    *,
    storage_path: str | None = None,
) -> dict[str, Any]:
    root = Path(storage_path) if storage_path else default_sqlite_store_root()
    journal_dir = root / "replay_execution_journal"
    journal_dir.mkdir(parents=True, exist_ok=True)
    now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    entry = {"replay_ref": replay_ref, "event": event, "at": now}
    path = journal_dir / f"{replay_ref}.jsonl"
    with path.open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(entry, sort_keys=True) + "\n")
    return {"journal_path": str(path), "entry": entry}


def restore_replay_checkpoint_runtime(
    replay_ref: str,
    *,
    storage_path: str | None = None,
) -> dict[str, Any]:
    root = Path(storage_path) if storage_path else None
    snap = sqlite_read_latest_snapshot(replay_ref, root=root)
    if not snap:
        return {"restored": False, "replay_ref": replay_ref}
    return {
        "restored": True,
        "replay_ref": replay_ref,
        "version": snap.get("version"),
        "integrity_ok": snap.get("integrity_ok"),
    }


def execute_deterministic_replay_runtime(
    replay_ref: str,
    payload: Mapping[str, Any] | None = None,
    *,
    storage_path: str | None = None,
) -> dict[str, Any]:
    body = dict(payload or {"replay_ref": replay_ref})
    root = Path(storage_path) if storage_path else None
    token = _replay_token(replay_ref, body)
    snap = sqlite_write_snapshot(replay_ref, body, root=root)
    ck = sqlite_checkpoint_runtime_write(replay_ref, {"token": token}, storage_path=storage_path)
    journal = append_replay_execution_journal(replay_ref, "executed", storage_path=storage_path)
    lock_root = root or default_sqlite_store_root()
    lock_file = lock_root / "locks" / f"{replay_ref}.lock"
    lock_file.parent.mkdir(parents=True, exist_ok=True)
    acquired = False
    try:
        fd = os.open(str(lock_file), os.O_CREAT | os.O_EXCL | os.O_WRONLY)
        os.close(fd)
        acquired = True
    except FileExistsError:
        acquired = False
    finally:
        lock_file.unlink(missing_ok=True)
    return {
        "replay_ref": replay_ref,
        "replay_execution_token": token,
        "snapshot": snap,
        "checkpoint": ck,
        "journal": journal,
        "lock_acquired": acquired,
        "assistant_notes": ["execute_deterministic_replay_runtime: parcial stdlib."],
        "deterministic_alignment": {"token": token},
    }
