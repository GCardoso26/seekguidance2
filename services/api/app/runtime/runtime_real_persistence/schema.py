"""Schema bootstrap — tenants, auth, replay, events, incidents, metrics."""

from __future__ import annotations

from app.runtime.runtime_real_persistence.config import backend
from app.runtime.runtime_real_persistence.connection import connect


def _ddl_sqlite() -> str:
    return """
    CREATE TABLE IF NOT EXISTS tenants (
        tenant_id TEXT PRIMARY KEY, name TEXT NOT NULL, owner TEXT,
        created_at REAL NOT NULL
    );
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL, role TEXT NOT NULL, tenant_id TEXT,
        created_at REAL NOT NULL
    );
    CREATE TABLE IF NOT EXISTS replays (
        replay_id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, scope TEXT NOT NULL,
        payload_json TEXT NOT NULL, integrity_hash TEXT NOT NULL, created_at REAL NOT NULL
    );
    CREATE TABLE IF NOT EXISTS runtime_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT, tenant_id TEXT, event_type TEXT,
        payload_json TEXT, created_at REAL NOT NULL
    );
    CREATE TABLE IF NOT EXISTS incidents (
        id INTEGER PRIMARY KEY AUTOINCREMENT, tenant_id TEXT, summary TEXT,
        severity TEXT, created_at REAL NOT NULL
    );
    CREATE TABLE IF NOT EXISTS metrics (
        name TEXT NOT NULL, value REAL NOT NULL, ts REAL NOT NULL
    );
    CREATE TABLE IF NOT EXISTS audit_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT, actor TEXT, action TEXT,
        detail_json TEXT, created_at REAL NOT NULL
    );
    """


def _ddl_postgres() -> str:
    return """
    CREATE TABLE IF NOT EXISTS tenants (
        tenant_id TEXT PRIMARY KEY, name TEXT NOT NULL, owner TEXT,
        created_at DOUBLE PRECISION NOT NULL
    );
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL, role TEXT NOT NULL, tenant_id TEXT,
        created_at DOUBLE PRECISION NOT NULL
    );
    CREATE TABLE IF NOT EXISTS replays (
        replay_id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, scope TEXT NOT NULL,
        payload_json TEXT NOT NULL, integrity_hash TEXT NOT NULL,
        created_at DOUBLE PRECISION NOT NULL
    );
    CREATE TABLE IF NOT EXISTS runtime_events (
        id SERIAL PRIMARY KEY, tenant_id TEXT, event_type TEXT,
        payload_json TEXT, created_at DOUBLE PRECISION NOT NULL
    );
    CREATE TABLE IF NOT EXISTS incidents (
        id SERIAL PRIMARY KEY, tenant_id TEXT, summary TEXT,
        severity TEXT, created_at DOUBLE PRECISION NOT NULL
    );
    CREATE TABLE IF NOT EXISTS metrics (
        name TEXT NOT NULL, value DOUBLE PRECISION NOT NULL, ts DOUBLE PRECISION NOT NULL
    );
    CREATE TABLE IF NOT EXISTS audit_entries (
        id SERIAL PRIMARY KEY, actor TEXT, action TEXT,
        detail_json TEXT, created_at DOUBLE PRECISION NOT NULL
    );
    """


def bootstrap_schema() -> dict[str, str]:
    ddl = _ddl_postgres() if backend() == "postgres" else _ddl_sqlite()
    with connect("runtime") as conn:
        if backend() == "postgres":
            with conn.cursor() as cur:  # type: ignore[attr-defined]
                for stmt in ddl.split(";"):
                    s = stmt.strip()
                    if s:
                        cur.execute(s)
        else:
            conn.executescript(ddl)
    return {"backend": backend(), "status": "ok"}
