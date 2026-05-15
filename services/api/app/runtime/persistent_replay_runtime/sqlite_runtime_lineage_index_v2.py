"""sqlite_runtime_lineage_index_v2 — índice lineage SQLite stdlib."""

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


def _root(storage_path: str | None) -> Path:
    return Path(storage_path) if storage_path else default_sqlite_store_root()


def sqlite_runtime_lineage_index_v2_upsert(
    replay_lineage_id: str,
    replay_ref: str,
    metadata: Mapping[str, Any] | None = None,
    *,
    storage_path: str | None = None,
) -> dict[str, Any]:
    root = _root(storage_path)
    db_path = root / "lineage_index_v2.db"
    now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    conn = connect_replay_sqlite(db_path)
    try:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS lineage_index_v2 (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                replay_lineage_id TEXT NOT NULL,
                replay_ref TEXT NOT NULL,
                metadata_json TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            INSERT INTO lineage_index_v2
            (replay_lineage_id, replay_ref, metadata_json, created_at)
            VALUES (?, ?, ?, ?)
            """,
            (replay_lineage_id, replay_ref, json.dumps(dict(metadata or {}), sort_keys=True), now),
        )
        conn.commit()
    finally:
        conn.close()
    return {
        "storage_path": str(root),
        "replay_lineage_id": replay_lineage_id,
        "replay_ref": replay_ref,
        "assistant_notes": ["sqlite_runtime_lineage_index_v2_upsert: sqlite opcional."],
        "lineage_summary": {"indexed_at": now},
        "integrity_status": {"ok": True},
        "deterministic_alignment": {"token": f"idx-{replay_ref}"},
    }


def sqlite_runtime_lineage_index_v2_stub(scope: str, *, storage_path: str | None = None) -> dict[str, Any]:
    return {
        "scope": scope,
        "storage_path": storage_path or str(default_sqlite_store_root()),
        "assistant_notes": ["sqlite_runtime_lineage_index_v2_stub: use upsert."],
        "lineage_summary": {},
        "integrity_status": {"ok": True},
        "deterministic_alignment": {"token": f"idx-{scope}"},
    }
