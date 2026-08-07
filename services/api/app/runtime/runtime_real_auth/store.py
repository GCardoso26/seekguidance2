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


_WEAK_ADMIN_PASSWORDS = frozenset(
    {"admin", "password", "123456", "changeme", "secret", "judgetcg", "tcgjudge"}
)


def ensure_default_admin(storage_path: str | None = None) -> None:
    cfg = get_settings()
    env_password = (
        cfg.runtime_default_admin_password
        or os.environ.get("RUNTIME_DEFAULT_ADMIN_PASSWORD")
    )
    path = init_db(storage_path)
    with sqlite3.connect(path) as conn:
        total_users = int(conn.execute("SELECT count(*) FROM users").fetchone()[0])
        row = conn.execute("SELECT id FROM users WHERE username = ?", ("admin",)).fetchone()

        if cfg.environment == "production":
            # Produção: nunca seed/atualiza com senha ausente ou fraca.
            if not env_password or env_password.strip().lower() in _WEAK_ADMIN_PASSWORDS:
                return
            if len(env_password.strip()) < 12:
                return

        if cfg.environment == "production" and not env_password and total_users > 0:
            return

        password = env_password or ("admin" if total_users == 0 and cfg.environment != "production" else None)
        if not password:
            return

        ph = crypto.hash_password(str(password))
        if row:
            conn.execute(
                "UPDATE users SET password_hash = ?, role = 'admin' WHERE username = ?",
                (ph, "admin"),
            )
        else:
            uid = secrets.token_hex(8)
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
