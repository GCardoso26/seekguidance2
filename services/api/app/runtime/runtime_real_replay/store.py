"""Replay persistence SQLite/filesystem."""

from __future__ import annotations

import gzip
import hashlib
import json
import sqlite3
import time
from pathlib import Path
from typing import Any

_DEFAULT_DB = Path("generated/runtime_real_minimal/replay.sqlite")


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
            CREATE TABLE IF NOT EXISTS replays (
                replay_id TEXT PRIMARY KEY,
                tenant_id TEXT NOT NULL,
                scope TEXT NOT NULL,
                payload_json TEXT NOT NULL,
                compressed INTEGER NOT NULL DEFAULT 0,
                integrity_hash TEXT NOT NULL,
                created_at REAL NOT NULL
            );
            """
        )
    return path


def _integrity(payload: dict[str, Any]) -> str:
    raw = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode()
    return hashlib.sha256(raw).hexdigest()


def append_replay(
    tenant_id: str,
    scope: str,
    payload: dict[str, Any],
    *,
    storage_path: str | None = None,
    compress: bool = False,
) -> dict[str, Any]:
    init_db(storage_path)
    path = _db_path(storage_path)
    replay_id = hashlib.sha256(f"{tenant_id}:{scope}:{time.time()}".encode()).hexdigest()[:16]
    digest = _integrity(payload)
    body = json.dumps(payload, separators=(",", ":"))
    if compress:
        body = gzip.compress(body.encode()).decode("latin1")
    with sqlite3.connect(path) as conn:
        sql = (
            "INSERT INTO replays "
            "(replay_id, tenant_id, scope, payload_json, compressed, integrity_hash, created_at) "
            "VALUES (?,?,?,?,?,?,?)"
        )
        conn.execute(sql, (replay_id, tenant_id, scope, body, int(compress), digest, time.time()))
        conn.commit()
    return {"replay_id": replay_id, "integrity_hash": digest, "compressed": compress}


def get_replay(replay_id: str, *, storage_path: str | None = None) -> dict[str, Any] | None:
    init_db(storage_path)
    path = _db_path(storage_path)
    with sqlite3.connect(path) as conn:
        row = conn.execute(
            "SELECT tenant_id, scope, payload_json, compressed, integrity_hash FROM replays WHERE replay_id = ?",
            (replay_id,),
        ).fetchone()
    if not row:
        return None
    tenant_id, scope, body, compressed, digest = row
    if compressed:
        body = gzip.decompress(body.encode("latin1")).decode()
    payload = json.loads(body)
    ok = _integrity(payload) == digest
    return {
        "replay_id": replay_id,
        "tenant_id": tenant_id,
        "scope": scope,
        "payload": payload,
        "integrity_ok": ok,
        "integrity_hash": digest,
    }


def list_replays(
    tenant_id: str | None = None,
    *,
    storage_path: str | None = None,
    limit: int = 50,
) -> list[dict[str, Any]]:
    init_db(storage_path)
    path = _db_path(storage_path)
    with sqlite3.connect(path) as conn:
        if tenant_id:
            sql = (
                "SELECT replay_id, tenant_id, scope, integrity_hash, created_at "
                "FROM replays WHERE tenant_id = ? ORDER BY created_at DESC LIMIT ?"
            )
            rows = conn.execute(sql, (tenant_id, limit)).fetchall()
        else:
            sql = (
                "SELECT replay_id, tenant_id, scope, integrity_hash, created_at "
                "FROM replays ORDER BY created_at DESC LIMIT ?"
            )
            rows = conn.execute(sql, (limit,)).fetchall()
    return [
        {"replay_id": r[0], "tenant_id": r[1], "scope": r[2], "integrity_hash": r[3], "created_at": r[4]}
        for r in rows
    ]


def export_replays(*, storage_path: str | None = None) -> list[dict[str, Any]]:
    init_db(storage_path)
    path = _db_path(storage_path)
    with sqlite3.connect(path) as conn:
        rows = conn.execute(
            "SELECT replay_id, tenant_id, scope, payload_json, compressed, integrity_hash, created_at FROM replays"
        ).fetchall()
    out: list[dict[str, Any]] = []
    for r in rows:
        body = r[3]
        if r[4]:
            body = gzip.decompress(body.encode("latin1")).decode()
        out.append(
            {
                "replay_id": r[0],
                "tenant_id": r[1],
                "scope": r[2],
                "payload": json.loads(body),
                "integrity_hash": r[5],
                "created_at": r[6],
            }
        )
    return out


def import_replays(records: list[dict[str, Any]], *, storage_path: str | None = None) -> int:
    init_db(storage_path)
    path = _db_path(storage_path)
    n = 0
    with sqlite3.connect(path) as conn:
        for rec in records:
            digest = rec.get("integrity_hash") or _integrity(rec["payload"])
            body = json.dumps(rec["payload"], separators=(",", ":"))
            sql = (
                "INSERT OR REPLACE INTO replays "
                "(replay_id, tenant_id, scope, payload_json, compressed, integrity_hash, created_at) "
                "VALUES (?,?,?,?,0,?,?)"
            )
            conn.execute(
                sql,
                (
                    rec["replay_id"],
                    rec["tenant_id"],
                    rec["scope"],
                    body,
                    digest,
                    rec.get("created_at", time.time()),
                ),
            )
            n += 1
        conn.commit()
    return n
