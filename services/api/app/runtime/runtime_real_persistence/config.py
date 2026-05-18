"""Configuração de persistência — SQLite default, Postgres opcional."""

from __future__ import annotations

import os
from pathlib import Path

_ARTIFACTS = Path("generated/runtime_artifacts/runtime_real_persistence_v1")
_SQLITE_ROOT = Path(os.environ.get("RUNTIME_DATA_DIR", "generated/runtime_real_minimal"))


def database_url() -> str | None:
    return os.environ.get("RUNTIME_DATABASE_URL") or os.environ.get("DATABASE_URL_RUNTIME")


def backend() -> str:
    url = database_url() or ""
    if url.startswith("postgres"):
        return "postgres"
    return "sqlite"


def sqlite_path(name: str) -> Path:
    return _SQLITE_ROOT / name
