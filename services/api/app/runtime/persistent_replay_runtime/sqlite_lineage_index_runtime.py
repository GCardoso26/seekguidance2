"""sqlite_lineage_index_runtime — índice de lineage em SQLite."""

from __future__ import annotations

from collections.abc import Mapping
from pathlib import Path
from typing import Any

from app.runtime.persistent_replay_runtime.sqlite_lineage_runtime import sqlite_lineage_runtime_anchor
from app.runtime.persistent_replay_runtime.sqlite_snapshot_store import default_sqlite_store_root


def sqlite_lineage_index_runtime_upsert(
    replay_lineage_id: str,
    replay_ref: str,
    metadata: Mapping[str, Any] | None = None,
    *,
    storage_path: str | None = None,
) -> dict[str, Any]:
    root = Path(storage_path) if storage_path else default_sqlite_store_root()
    anchor = sqlite_lineage_runtime_anchor(
        replay_lineage_id,
        replay_ref,
        metadata,
        root=root,
    )
    return {
        "replay_ref": replay_ref,
        "storage_path": str(root),
        "assistant_notes": ["sqlite_lineage_index_runtime_upsert: índice lineage parcial."],
        "replay_summary": {},
        "lineage_summary": {"anchor_token": anchor.get("anchor_token")},
        "deterministic_alignment": {"token": f"idx-{replay_ref}"},
        "integrity_status": {"ok": True},
    }


def sqlite_lineage_index_runtime_stub(
    replay_ref: str,
    *,
    storage_path: str | None = None,
) -> dict[str, Any]:
    return {
        "replay_ref": replay_ref,
        "storage_path": storage_path or str(default_sqlite_store_root()),
        "assistant_notes": ["sqlite_lineage_index_runtime_stub: use upsert."],
        "replay_summary": {},
        "lineage_summary": {},
        "deterministic_alignment": {"token": f"idx-{replay_ref}"},
        "integrity_status": {"ok": True},
    }
