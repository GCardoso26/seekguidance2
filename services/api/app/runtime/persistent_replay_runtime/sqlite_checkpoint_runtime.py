"""sqlite_checkpoint_runtime — checkpoints reais via SQLite stdlib."""

from __future__ import annotations

import json
import time
from collections.abc import Mapping
from pathlib import Path
from typing import Any

from app.runtime.persistent_replay_runtime.sqlite_snapshot_store import (
    connect_replay_sqlite,
    default_sqlite_store_root,
)


def _db_path(storage_path: str | None) -> Path:
    if storage_path:
        return Path(storage_path) / "snapshots.db"
    return default_sqlite_store_root() / "snapshots.db"


def sqlite_checkpoint_runtime_write(
    replay_ref: str,
    checkpoint: Mapping[str, Any],
    *,
    storage_path: str | None = None,
) -> dict[str, Any]:
    db_path = _db_path(storage_path)
    now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    payload = json.dumps(dict(checkpoint), sort_keys=True)
    conn = connect_replay_sqlite(db_path)
    try:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS replay_checkpoint (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                replay_ref TEXT NOT NULL,
                payload_json TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        conn.execute(
            "INSERT INTO replay_checkpoint (replay_ref, payload_json, created_at) VALUES (?, ?, ?)",
            (replay_ref, payload, now),
        )
        conn.commit()
    finally:
        conn.close()
    return {
        "replay_ref": replay_ref,
        "storage_path": str(db_path.parent),
        "assistant_notes": ["sqlite_checkpoint_runtime_write: checkpoint real opcional."],
        "replay_summary": {"checkpointed_at": now},
        "lineage_summary": {},
        "deterministic_alignment": {"token": f"chk-{replay_ref}"},
        "integrity_status": {"ok": True},
    }


def sqlite_checkpoint_runtime_stub(
    replay_ref: str,
    *,
    storage_path: str | None = None,
) -> dict[str, Any]:
    return {
        "replay_ref": replay_ref,
        "storage_path": storage_path or str(default_sqlite_store_root()),
        "assistant_notes": ["sqlite_checkpoint_runtime_stub: use write para persistir."],
        "replay_summary": {},
        "lineage_summary": {},
        "deterministic_alignment": {"token": f"chk-{replay_ref}"},
        "integrity_status": {"ok": True},
    }
