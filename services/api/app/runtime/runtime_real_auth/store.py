"""Persistência SQLite para auth — passwords bcrypt, API keys com salt."""

from __future__ import annotations

import os
import secrets
import sqlite3
import time
from pathlib import Path
from typing import Any

from app.core.config import get_settings
from app.core.security import crypto

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


def ensure_default_admin(storage_path: str | None = None) -> None:
    cfg = get_settings()
    if cfg.environment == "production" and not cfg.runtime_default_admin_password:
        return
    path = init_db(storage_path)
    with sqlite3.connect(path) as conn:
        row = conn.execute("SELECT id FROM users WHERE username = ?", ("admin",)).fetchone()
        if row:
            return
        uid = secrets.token_hex(8)
        plain = (
            cfg.runtime_default_admin_password
            or os.environ.get("RUNTIME_DEFAULT_ADMIN_PASSWORD")
            or ("admin" if cfg.environment != "production" else secrets.token_urlsafe(24))
        )
        ph = crypto.hash_password(plain)
        conn.execute(
            "INSERT INTO users (id, username, password_hash, role, tenant_id, created_at) VALUES (?,?,?,?,?,?)",
            (uid, "admin", ph, "admin", "default", time.time()),
        )
        conn.commit()


def get_user_by_id(user_id: str, *, storage_path: str | None = None) -> dict[str, Any] | None:
    path = _db_path(storage_path)
    if not path.is_file():
        return None
    with sqlite3.connect(path) as conn:
        row = conn.execute(
            "SELECT id, username, role, tenant_id FROM users WHERE id = ?",
            (user_id,),
        ).fetchone()
    if not row:
        return None
    uid, uname, role, tenant_id = row
    return {"id": uid, "username": uname, "role": role, "tenant_id": tenant_id or "default"}


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
    if not crypto.verify_password(password, ph):
        return None
    return {"id": uid, "username": uname, "role": role, "tenant_id": tenant_id or "default"}


def verify_api_key(
    api_key: str,
    *,
    storage_path: str | None = None,
) -> dict[str, Any] | None:
    ensure_default_admin(storage_path)
    path = _db_path(storage_path)
    with sqlite3.connect(path) as conn:
        rows = conn.execute(
            "SELECT key_id, key_hash, role, tenant_id, label FROM api_keys",
        ).fetchall()
    for row in rows:
        key_id, key_hash, role, tenant_id, label = row
        if crypto.verify_api_key(api_key, key_hash):
            return {
                "key_id": key_id,
                "role": role,
                "tenant_id": tenant_id or "default",
                "label": label,
            }
    return None
