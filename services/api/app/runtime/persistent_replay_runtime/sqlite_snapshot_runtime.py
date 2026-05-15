"""sqlite_snapshot_runtime — wrapper leve sobre sqlite_snapshot_store."""

from __future__ import annotations

from collections.abc import Mapping
from pathlib import Path
from typing import Any

from app.runtime.persistent_replay_runtime.sqlite_snapshot_store import (
    default_sqlite_store_root,
    sqlite_read_latest_snapshot,
    sqlite_write_snapshot,
)


def sqlite_snapshot_runtime_put(
    replay_ref: str,
    payload: Mapping[str, Any],
    *,
    root: Path | None = None,
) -> dict[str, Any]:
    store_root = root or default_sqlite_store_root()
    meta = sqlite_write_snapshot(replay_ref, payload, root=store_root)
    return {
        **meta,
        "snapshot_integrity": {"integrity_hash": meta.get("integrity_hash")},
        "replay_checkpoint_summary": {"version": meta.get("version")},
        "assistant_notes": [
            "sqlite_snapshot_runtime_put: sqlite opcional; fallback filesystem.",
        ],
    }


def sqlite_snapshot_runtime_get(
    replay_ref: str,
    *,
    root: Path | None = None,
) -> dict[str, Any]:
    store_root = root or default_sqlite_store_root()
    row = sqlite_read_latest_snapshot(replay_ref, root=store_root)
    if row is None:
        return {
            "replay_ref": replay_ref,
            "found": False,
            "assistant_notes": ["sqlite_snapshot_runtime_get: sem snapshot; degradação graciosa."],
        }
    return {
        "replay_ref": replay_ref,
        "found": True,
        "snapshot_integrity": {
            "integrity_hash": row.get("integrity_hash"),
            "integrity_ok": row.get("integrity_ok"),
        },
        "replay_checkpoint_summary": {"version": row.get("version")},
        "payload": row.get("payload"),
        "assistant_notes": ["sqlite_snapshot_runtime_get: leitura sqlite stdlib."],
    }


def sqlite_snapshot_runtime_stub(replay_ref: str) -> dict[str, Any]:
    return sqlite_snapshot_runtime_get(replay_ref)
