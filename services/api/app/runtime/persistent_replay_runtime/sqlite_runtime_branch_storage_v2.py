"""sqlite_runtime_branch_storage_v2 — branches replay em SQLite."""

from __future__ import annotations

import time
from pathlib import Path
from typing import Any

from app.runtime.persistent_replay_runtime.sqlite_snapshot_store import (
    connect_replay_sqlite,
    default_sqlite_store_root,
)


def sqlite_runtime_branch_storage_v2_put(
    replay_ref: str,
    branch_id: str,
    *,
    storage_path: str | None = None,
) -> dict[str, Any]:
    root = Path(storage_path) if storage_path else default_sqlite_store_root()
    db_path = root / "branch_v2.db"
    now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    conn = connect_replay_sqlite(db_path)
    try:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS replay_branch_v2 (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                replay_ref TEXT NOT NULL,
                branch_id TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        conn.execute(
            "INSERT INTO replay_branch_v2 (replay_ref, branch_id, created_at) VALUES (?, ?, ?)",
            (replay_ref, branch_id, now),
        )
        conn.commit()
    finally:
        conn.close()
    return {
        "storage_path": str(root),
        "replay_ref": replay_ref,
        "branch_id": branch_id,
        "assistant_notes": ["sqlite_runtime_branch_storage_v2_put: branch storage opcional."],
        "replay_summary": {"branch_stored_at": now},
        "integrity_status": {"ok": True},
        "deterministic_alignment": {"token": f"br-{replay_ref}"},
    }


def sqlite_runtime_branch_storage_v2_stub(scope: str, *, storage_path: str | None = None) -> dict[str, Any]:
    return {
        "scope": scope,
        "storage_path": storage_path or str(default_sqlite_store_root()),
        "assistant_notes": ["sqlite_runtime_branch_storage_v2_stub: use put."],
        "replay_summary": {},
        "integrity_status": {"ok": True},
        "deterministic_alignment": {"token": f"br-{scope}"},
    }
