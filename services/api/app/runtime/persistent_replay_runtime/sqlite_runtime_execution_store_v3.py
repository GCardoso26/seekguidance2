"""sqlite_runtime_execution_store_v3 — SQLite execution store."""

from __future__ import annotations

import json
import sqlite3
import time
from pathlib import Path
from typing import Any

_ROOT = Path("generated/runtime_artifacts/persistence_v2")


def store_execution(scope: str, payload: dict[str, Any], *, storage_path: str | None = None) -> dict[str, Any]:
    root = Path(storage_path) if storage_path else _ROOT
    root.mkdir(parents=True, exist_ok=True)
    db = root / "execution_store.sqlite"
    conn = sqlite3.connect(str(db))
    try:
        conn.execute(
            "CREATE TABLE IF NOT EXISTS executions (scope TEXT, payload TEXT, at REAL)"
        )
        conn.execute(
            "INSERT INTO executions (scope, payload, at) VALUES (?, ?, ?)",
            (scope, json.dumps(payload, sort_keys=True), time.time()),
        )
        conn.commit()
        count = conn.execute("SELECT COUNT(*) FROM executions WHERE scope=?", (scope,)).fetchone()[0]
    finally:
        conn.close()
    return {"db": str(db), "scope": scope, "records": count}


def sqlite_runtime_execution_store_v3_stub(
    scope: str,
    *,
    storage_path: str | None = None,
) -> dict[str, Any]:
    meta = store_execution(scope, {"v": 3}, storage_path=storage_path)
    return {
        "scope": scope,
        "storage_path": meta["db"],
        "assistant_notes": ["sqlite_runtime_execution_store_v3: persistence v2."],
        "deterministic_alignment": {"token": f"sqlx3-{scope}"},
        "runtime_confidence": 0.92,
        "replay_summary": {},
        "lineage_summary": meta,
        "divergence_summary": {},
        "governance_summary": meta,
        "lifecycle_summary": {},
        "operational_notes": ["sqlite_optional"],
        "persistence_summary": meta,
    }
