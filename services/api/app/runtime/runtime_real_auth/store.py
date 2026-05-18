"""Persistência SQLite para auth minimal (stdlib)."""

from __future__ import annotations

import hashlib
import secrets
import sqlite3
from pathlib import Path
from typing import Any

_DEFAULT_DB = Path("generated/runtime_real_minimal/auth.sqlite")


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
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'viewer',
                tenant_id TEXT,
                created_at REAL NOT NULL
            );
            CREATE TABLE IF NOT EXISTS api_keys (
                key_id TEXT PRIMARY KEY,
                key_hash TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'viewer',
                tenant_id TEXT,
                label TEXT,
                created_at REAL NOT NULL
            );
            """
        )
    return path


def _hash_password(password: str, salt: str) -> str:
    return hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 120_000).hex()


def ensure_default_admin(storage_path: str | None = None) -> None:
    import time

    path = init_db(storage_path)
    with sqlite3.connect(path) as conn:
        row = conn.execute("SELECT id FROM users WHERE username = ?", ("admin",)).fetchone()
        if row:
            return
        uid = secrets.token_hex(8)
        salt = secrets.token_hex(16)
        ph = f"{salt}${_hash_password('admin', salt)}"
        conn.execute(
            "INSERT INTO users (id, username, password_hash, role, tenant_id, created_at) VALUES (?,?,?,?,?,?)",
            (uid, "admin", ph, "admin", "default", time.time()),
        )
        conn.commit()


def verify_user(
    username: str,
    password: str,
    *,
    storage_path: str | None = None,
) -> dict[str, Any] | None:
    ensure_default_admin(storage_path)
    path = _db_path(storage_path)
    with sqlite3.connect(path) as conn:
        row = conn.execute(
            "SELECT id, username, password_hash, role, tenant_id FROM users WHERE username = ?",
            (username,),
        ).fetchone()
    if not row:
        return None
    uid, uname, ph, role, tenant_id = row
    salt, _, digest = ph.partition("$")
    if _hash_password(password, salt) != digest:
        return None
    return {"id": uid, "username": uname, "role": role, "tenant_id": tenant_id or "default"}


def verify_api_key(
    api_key: str,
    *,
    storage_path: str | None = None,
) -> dict[str, Any] | None:
    ensure_default_admin(storage_path)
    path = _db_path(storage_path)
    key_hash = hashlib.sha256(api_key.encode()).hexdigest()
    with sqlite3.connect(path) as conn:
        row = conn.execute(
            "SELECT key_id, role, tenant_id, label FROM api_keys WHERE key_hash = ?",
            (key_hash,),
        ).fetchone()
    if not row:
        return None
    return {"key_id": row[0], "role": row[1], "tenant_id": row[2] or "default", "label": row[3]}
