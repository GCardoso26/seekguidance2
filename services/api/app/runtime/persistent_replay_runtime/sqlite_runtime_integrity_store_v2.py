"""sqlite_runtime_integrity_store_v2 — store de integridade SQLite."""

from __future__ import annotations

import hashlib
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


def sqlite_runtime_integrity_store_v2_put(
    replay_ref: str,
    payload: Mapping[str, Any],
    *,
    storage_path: str | None = None,
) -> dict[str, Any]:
    root = _root(storage_path)
    db_path = root / "integrity_v2.db"
    raw = json.dumps(dict(payload), sort_keys=True)
    integrity_hash = hashlib.sha256(raw.encode("utf-8")).hexdigest()
    now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    conn = connect_replay_sqlite(db_path)
    try:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS integrity_store_v2 (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                replay_ref TEXT NOT NULL,
                integrity_hash TEXT NOT NULL,
                payload_json TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        conn.execute(
            "INSERT INTO integrity_store_v2 (replay_ref, integrity_hash, payload_json, created_at) VALUES (?, ?, ?, ?)",
            (replay_ref, integrity_hash, raw, now),
        )
        conn.commit()
    finally:
        conn.close()
    return {
        "storage_path": str(root),
        "replay_ref": replay_ref,
        "integrity_hash": integrity_hash,
        "assistant_notes": ["sqlite_runtime_integrity_store_v2_put: persistência parcial."],
        "integrity_status": {"ok": True},
        "deterministic_alignment": {"token": f"int-{replay_ref}"},
    }


def sqlite_runtime_integrity_store_v2_stub(scope: str, *, storage_path: str | None = None) -> dict[str, Any]:
    return {
        "scope": scope,
        "storage_path": storage_path or str(default_sqlite_store_root()),
        "assistant_notes": ["sqlite_runtime_integrity_store_v2_stub: use put."],
        "integrity_status": {"ok": True},
        "deterministic_alignment": {"token": f"int-{scope}"},
    }
