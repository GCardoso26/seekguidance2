"""Federation node registry minimal."""

from __future__ import annotations

import json
import sqlite3
import time
from pathlib import Path
from typing import Any

_DEFAULT_DB = Path("generated/runtime_real_minimal/federation.sqlite")
_HEARTBEAT_TTL = 120.0


def _db_path(storage_path: str | None) -> Path:
    if storage_path:
        return Path(storage_path)
    return _DEFAULT_DB


def init_db(storage_path: str | None = None) -> Path:
    path = _db_path(storage_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(path) as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS nodes (
                node_id TEXT PRIMARY KEY,
                endpoint TEXT NOT NULL,
                last_heartbeat REAL NOT NULL,
                health TEXT NOT NULL DEFAULT 'unknown',
                meta_json TEXT
            );
            """
        )
    return path


def register_node(node_id: str, endpoint: str, *, storage_path: str | None = None) -> dict[str, Any]:
    init_db(storage_path)
    path = _db_path(storage_path)
    now = time.time()
    with sqlite3.connect(path) as conn:
        conn.execute(
            "INSERT OR REPLACE INTO nodes (node_id, endpoint, last_heartbeat, health, meta_json) VALUES (?,?,?,?,?)",
            (node_id, endpoint, now, "ok", json.dumps({"registered_at": now})),
        )
        conn.commit()
    return {"node_id": node_id, "endpoint": endpoint, "health": "ok"}


def heartbeat(node_id: str, *, storage_path: str | None = None, health: str = "ok") -> bool:
    init_db(storage_path)
    path = _db_path(storage_path)
    now = time.time()
    with sqlite3.connect(path) as conn:
        cur = conn.execute(
            "UPDATE nodes SET last_heartbeat = ?, health = ? WHERE node_id = ?",
            (now, health, node_id),
        )
        conn.commit()
        return cur.rowcount > 0


def list_nodes(*, storage_path: str | None = None) -> list[dict[str, Any]]:
    init_db(storage_path)
    path = _db_path(storage_path)
    now = time.time()
    with sqlite3.connect(path) as conn:
        rows = conn.execute(
            "SELECT node_id, endpoint, last_heartbeat, health FROM nodes"
        ).fetchall()
    out = []
    for r in rows:
        alive = (now - r[2]) <= _HEARTBEAT_TTL
        out.append(
            {
                "node_id": r[0],
                "endpoint": r[1],
                "last_heartbeat": r[2],
                "health": r[3] if alive else "stale",
                "alive": alive,
            }
        )
    return out
