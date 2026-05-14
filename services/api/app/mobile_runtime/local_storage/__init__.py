"""Abstracção de armazenamento local (SQLite/Realm/filesystem — stub)."""

from __future__ import annotations

from typing import Any


def local_storage_schema_stub() -> dict[str, Any]:
    return {
        "backends": ["sqlite", "realm", "filesystem_chunks"],
        "assistant_notes": ["Contratos alinhados a payloads explainability-first; sem CNF bruto."],
    }
