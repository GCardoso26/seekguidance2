"""Bridge operacional SQLite para replay (adapter stub, sem engine pesado)."""

from __future__ import annotations

from typing import Any

from app.runtime.persistent_replay_runtime.contracts import StorageDialect


def replay_storage_sqlite_bridge_stub(replay_ref: str) -> dict[str, Any]:
    return {
        "replay_ref": replay_ref,
        "dialect": StorageDialect.SQLITE.value,
        "consistency_summary": {"wal_mode_hint": True, "integrity_check_scheduled": False},
        "assistant_notes": ["replay_storage_sqlite_bridge: opcional; juiz audita schema."],
        "deterministic_runtime_notes": ["Bindings apenas a refs de replay, não a reasoning core."],
    }
