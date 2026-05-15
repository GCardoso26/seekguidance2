"""Armazenamento leve de snapshots em SQLite (stdlib, opcional)."""

from __future__ import annotations

import hashlib
import json
import os
import sqlite3
import time
from collections.abc import Mapping
from pathlib import Path
from typing import Any


def default_sqlite_store_root() -> Path:
    raw = os.environ.get("TCG_JUDGE_REPLAY_SQLITE_DIR", "")
    if raw:
        return Path(raw)
    return Path.cwd() / "var" / "replay_sqlite"


def connect_replay_sqlite(db_path: Path) -> sqlite3.Connection:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(db_path))
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS replay_snapshot (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            replay_ref TEXT NOT NULL,
            version INTEGER NOT NULL,
            payload_json TEXT NOT NULL,
            integrity_hash TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
        """
    )
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS replay_lineage_anchor (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            replay_lineage_id TEXT NOT NULL,
            replay_ref TEXT NOT NULL,
            anchor_token TEXT NOT NULL,
            metadata_json TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
        """
    )
    conn.commit()
    return conn


def sqlite_write_snapshot(
    replay_ref: str,
    payload: Mapping[str, Any],
    *,
    root: Path | None = None,
) -> dict[str, Any]:
    """Persiste snapshot versionado com hash de integridade."""
    root = root or default_sqlite_store_root()
    db_path = root / "snapshots.db"
    payload_json = json.dumps(dict(payload), sort_keys=True, separators=(",", ":"))
    integrity_hash = hashlib.sha256(payload_json.encode("utf-8")).hexdigest()
    now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    conn = connect_replay_sqlite(db_path)
    try:
        cur = conn.execute(
            "SELECT COALESCE(MAX(version), 0) FROM replay_snapshot WHERE replay_ref = ?",
            (replay_ref,),
        )
        version = int(cur.fetchone()[0]) + 1
        conn.execute(
            """
            INSERT INTO replay_snapshot (replay_ref, version, payload_json, integrity_hash, created_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (replay_ref, version, payload_json, integrity_hash, now),
        )
        conn.commit()
        return {
            "storage": "sqlite",
            "replay_ref": replay_ref,
            "version": version,
            "integrity_hash": integrity_hash,
            "assistant_notes": [
                "sqlite_snapshot_store: persistência local opcional; juiz audita conteúdo.",
            ],
        }
    finally:
        conn.close()


def sqlite_read_latest_snapshot(replay_ref: str, *, root: Path | None = None) -> dict[str, Any] | None:
    root = root or default_sqlite_store_root()
    db_path = root / "snapshots.db"
    if not db_path.is_file():
        return None
    conn = sqlite3.connect(str(db_path))
    try:
        cur = conn.execute(
            """
            SELECT version, payload_json, integrity_hash, created_at
            FROM replay_snapshot
            WHERE replay_ref = ?
            ORDER BY version DESC
            LIMIT 1
            """,
            (replay_ref,),
        )
        row = cur.fetchone()
        if not row:
            return None
        version, payload_json, integrity_hash, created_at = row
        recomputed = hashlib.sha256(payload_json.encode("utf-8")).hexdigest()
        return {
            "replay_ref": replay_ref,
            "version": version,
            "payload": json.loads(payload_json),
            "integrity_hash": integrity_hash,
            "integrity_ok": recomputed == integrity_hash,
            "created_at": created_at,
        }
    finally:
        conn.close()
