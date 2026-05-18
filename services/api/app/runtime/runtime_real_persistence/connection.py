"""Conexões SQLite (stdlib) e Postgres opcional (psycopg degradável)."""

from __future__ import annotations

import sqlite3
from collections.abc import Iterator
from contextlib import contextmanager
from typing import Any

from app.runtime.runtime_real_persistence.config import backend, database_url, sqlite_path


@contextmanager
def sqlite_conn(name: str = "runtime.db") -> Iterator[sqlite3.Connection]:
    path = sqlite_path(name)
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(path)
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


@contextmanager
def postgres_conn() -> Iterator[Any]:
    url = database_url()
    if not url:
        raise RuntimeError("RUNTIME_DATABASE_URL not set")
    try:
        import psycopg
    except ImportError as exc:
        raise RuntimeError("psycopg not installed; use SQLite or pip install psycopg") from exc
    with psycopg.connect(url) as conn:
        yield conn
        conn.commit()


@contextmanager
def connect(table_set: str = "runtime") -> Iterator[Any]:
    if backend() == "postgres":
        with postgres_conn() as conn:
            yield conn
    else:
        with sqlite_conn(f"{table_set}.sqlite") as conn:
            yield conn
