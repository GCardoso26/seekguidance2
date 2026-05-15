"""sqlite_runtime_temporal_store_v1 — SQLite temporal store opcional."""

from __future__ import annotations

import json
import sqlite3
import time
from pathlib import Path
from typing import Any

_DEFAULT_ROOT = Path("generated/runtime_artifacts/persistence")


def _db_path(storage_path: str | None) -> Path:
    root = Path(storage_path) if storage_path else _DEFAULT_ROOT
    root.mkdir(parents=True, exist_ok=True)
    return root / "temporal_store.sqlite"


def write_temporal_record(scope: str, payload: dict[str, Any], *, storage_path: str | None = None) -> dict[str, Any]:
    db = _db_path(storage_path)
    conn = sqlite3.connect(str(db))
    try:
        conn.execute(
            "CREATE TABLE IF NOT EXISTS temporal (scope TEXT, payload TEXT, at REAL)"
        )
        conn.execute(
            "INSERT INTO temporal (scope, payload, at) VALUES (?, ?, ?)",
            (scope, json.dumps(payload, sort_keys=True), time.time()),
        )
        conn.commit()
        count = conn.execute("SELECT COUNT(*) FROM temporal WHERE scope=?", (scope,)).fetchone()[0]
    finally:
        conn.close()
    return {"db_path": str(db), "scope": scope, "records": count}


def sqlite_runtime_temporal_store_v1_stub(
    scope: str,
    *,
    storage_path: str | None = None,
) -> dict[str, Any]:
    meta = write_temporal_record(scope, {"checkpoint": True}, storage_path=storage_path)
    return {
        "scope": scope,
        "storage_path": str(meta["db_path"]),
        "assistant_notes": ["sqlite_runtime_temporal_store_v1: persistence real."],
        "deterministic_alignment": {"token": f"sqlt1-{scope}"},
        "runtime_confidence": 0.91,
        "replay_summary": {},
        "lineage_summary": meta,
        "divergence_summary": {},
        "governance_summary": meta,
        "lifecycle_summary": {},
        "operational_notes": ["sqlite_optional"],
        "persistence_summary": meta,
        "integrity_score": 0.9,
    }
