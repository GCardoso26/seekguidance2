"""Tenant registry SQLite."""

from __future__ import annotations

import sqlite3
import time
from pathlib import Path
from typing import Any

_DEFAULT_DB = Path("generated/runtime_real_minimal/tenants.sqlite")


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
            CREATE TABLE IF NOT EXISTS tenants (
                tenant_id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                owner TEXT,
                quota_events INTEGER DEFAULT 10000,
                quota_replays INTEGER DEFAULT 5000,
                scope TEXT DEFAULT 'default',
                created_at REAL NOT NULL
            );
            """
        )
        row = conn.execute("SELECT tenant_id FROM tenants WHERE tenant_id = ?", ("default",)).fetchone()
        if not row:
            conn.execute(
                "INSERT INTO tenants (tenant_id, name, owner, created_at) VALUES (?,?,?,?)",
                ("default", "Default Tenant", "system", time.time()),
            )
            conn.commit()
    return path


def list_tenants(*, storage_path: str | None = None) -> list[dict[str, Any]]:
    init_db(storage_path)
    path = _db_path(storage_path)
    with sqlite3.connect(path) as conn:
        rows = conn.execute(
            "SELECT tenant_id, name, owner, quota_events, quota_replays, scope FROM tenants"
        ).fetchall()
    return [
        {
            "tenant_id": r[0],
            "name": r[1],
            "owner": r[2],
            "quota_events": r[3],
            "quota_replays": r[4],
            "scope": r[5],
        }
        for r in rows
    ]


def create_tenant(
    tenant_id: str,
    name: str,
    *,
    owner: str = "operator",
    storage_path: str | None = None,
) -> dict[str, Any]:
    init_db(storage_path)
    path = _db_path(storage_path)
    with sqlite3.connect(path) as conn:
        conn.execute(
            "INSERT INTO tenants (tenant_id, name, owner, created_at) VALUES (?,?,?,?)",
            (tenant_id, name, owner, time.time()),
        )
        conn.commit()
    return {"tenant_id": tenant_id, "name": name, "owner": owner}
