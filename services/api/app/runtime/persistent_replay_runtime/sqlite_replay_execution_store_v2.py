"""Store SQLite para execuções de replay v2."""

from __future__ import annotations

import json
import time
from collections.abc import Mapping
from pathlib import Path
from typing import Any

from app.runtime.persistent_replay_runtime.replay_execution_core_v6 import execute_deterministic_replay_runtime
from app.runtime.persistent_replay_runtime.sqlite_snapshot_store import connect_replay_sqlite, default_sqlite_store_root


def sqlite_replay_execution_store_v2_put(
    replay_ref: str,
    payload: Mapping[str, Any],
    *,
    storage_path: str | None = None,
) -> dict[str, Any]:
    root = Path(storage_path) if storage_path else default_sqlite_store_root()
    db_path = root / "replay_execution_v2.db"
    now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    raw = json.dumps(dict(payload), sort_keys=True)
    conn = connect_replay_sqlite(db_path)
    try:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS replay_execution_v2 (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                replay_ref TEXT NOT NULL,
                payload_json TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        conn.execute(
            "INSERT INTO replay_execution_v2 (replay_ref, payload_json, created_at) VALUES (?, ?, ?)",
            (replay_ref, raw, now),
        )
        conn.commit()
    finally:
        conn.close()
    executed = execute_deterministic_replay_runtime(replay_ref, payload, storage_path=storage_path)
    return {
        "storage_path": str(root),
        "replay_ref": replay_ref,
        "executed": executed,
        "assistant_notes": ["sqlite_replay_execution_store_v2_put: store + execute."],
    }


def sqlite_replay_execution_store_v2_stub(scope: str, *, storage_path: str | None = None) -> dict[str, Any]:
    put = sqlite_replay_execution_store_v2_put(scope, {"scope": scope}, storage_path=storage_path)
    return {
        "scope": scope,
        "storage_path": storage_path or "default",
        "assistant_notes": put["assistant_notes"],
        "deterministic_alignment": {"token": f"sql-{scope}"},
        "runtime_confidence": 0.85,
        "replay_summary": put.get("executed", {}),
        "lineage_summary": {},
        "divergence_summary": {},
        "operational_notes": [],
        "replay_execution_summary": put,
        "deterministic_replay_hints": [],
        "temporal_ordering": {"bounded": True},
    }
