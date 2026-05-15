"""sqlite_runtime_replay_archive_v2 — arquivo replay em SQLite."""

from __future__ import annotations

from collections.abc import Mapping
from pathlib import Path
from typing import Any

from app.runtime.persistent_replay_runtime.sqlite_snapshot_store import (
    default_sqlite_store_root,
    sqlite_write_snapshot,
)


def sqlite_runtime_replay_archive_v2_put(
    replay_ref: str,
    payload: Mapping[str, Any],
    *,
    storage_path: str | None = None,
) -> dict[str, Any]:
    root = Path(storage_path) if storage_path else default_sqlite_store_root()
    meta = sqlite_write_snapshot(replay_ref, payload, root=root / "archive_v2")
    return {
        "storage_path": str(root),
        "replay_ref": replay_ref,
        "version": meta.get("version"),
        "integrity_hash": meta.get("integrity_hash"),
        "assistant_notes": ["sqlite_runtime_replay_archive_v2_put: archive sqlite/filesystem."],
        "replay_summary": {"archived": True},
        "integrity_status": {"ok": True},
        "deterministic_alignment": {"token": f"arc-{replay_ref}"},
    }


def sqlite_runtime_replay_archive_v2_stub(scope: str, *, storage_path: str | None = None) -> dict[str, Any]:
    return {
        "scope": scope,
        "storage_path": storage_path or str(default_sqlite_store_root()),
        "assistant_notes": ["sqlite_runtime_replay_archive_v2_stub: use put."],
        "replay_summary": {},
        "integrity_status": {"ok": True},
        "deterministic_alignment": {"token": f"arc-{scope}"},
    }
