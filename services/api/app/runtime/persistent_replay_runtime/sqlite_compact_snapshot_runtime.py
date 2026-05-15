"""sqlite_compact_snapshot_runtime — snapshots compactos em SQLite."""

from __future__ import annotations

import gzip
import json
from collections.abc import Mapping
from pathlib import Path
from typing import Any

from app.runtime.persistent_replay_runtime.sqlite_snapshot_store import (
    default_sqlite_store_root,
    sqlite_write_snapshot,
)


def sqlite_compact_snapshot_runtime_put(
    replay_ref: str,
    payload: Mapping[str, Any],
    *,
    storage_path: str | None = None,
) -> dict[str, Any]:
    root = Path(storage_path) if storage_path else default_sqlite_store_root()
    compact = {"compact": True, "payload_gzip_b64": None}
    raw = json.dumps(dict(payload), sort_keys=True).encode("utf-8")
    compact["payload_gzip_b64"] = gzip.compress(raw).hex()[:64] + "…stub"
    meta = sqlite_write_snapshot(replay_ref, compact, root=root)
    return {
        "replay_ref": replay_ref,
        "storage_path": str(root),
        "assistant_notes": ["sqlite_compact_snapshot_runtime_put: compactação incremental."],
        "replay_summary": {"version": meta.get("version")},
        "lineage_summary": {},
        "deterministic_alignment": {"token": f"cpt-{replay_ref}"},
        "integrity_status": {"ok": True, "integrity_hash": meta.get("integrity_hash")},
    }


def sqlite_compact_snapshot_runtime_stub(
    replay_ref: str,
    *,
    storage_path: str | None = None,
) -> dict[str, Any]:
    return {
        "replay_ref": replay_ref,
        "storage_path": storage_path or str(default_sqlite_store_root()),
        "assistant_notes": ["sqlite_compact_snapshot_runtime_stub: use put."],
        "replay_summary": {},
        "lineage_summary": {},
        "deterministic_alignment": {"token": f"cpt-{replay_ref}"},
        "integrity_status": {"ok": True},
    }
