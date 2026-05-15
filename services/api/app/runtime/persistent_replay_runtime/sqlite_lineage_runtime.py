"""sqlite_lineage_runtime — anchors de lineage em SQLite (stdlib)."""

from __future__ import annotations

import json
import time
from collections.abc import Mapping
from pathlib import Path
from typing import Any

from app.runtime.persistent_replay_runtime.sqlite_snapshot_store import (
    connect_replay_sqlite,
    default_sqlite_store_root,
)


def sqlite_lineage_runtime_anchor(
    replay_lineage_id: str,
    replay_ref: str,
    metadata: Mapping[str, Any] | None = None,
    *,
    root: Path | None = None,
) -> dict[str, Any]:
    store_root = root or default_sqlite_store_root()
    db_path = store_root / "snapshots.db"
    now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    anchor_token = f"lineage-{replay_lineage_id}-{replay_ref}"
    meta_json = json.dumps(dict(metadata or {}), sort_keys=True)
    conn = connect_replay_sqlite(db_path)
    try:
        conn.execute(
            """
            INSERT INTO replay_lineage_anchor
            (replay_lineage_id, replay_ref, anchor_token, metadata_json, created_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (replay_lineage_id, replay_ref, anchor_token, meta_json, now),
        )
        conn.commit()
    finally:
        conn.close()
    return {
        "storage": "sqlite",
        "replay_lineage_id": replay_lineage_id,
        "replay_ref": replay_ref,
        "anchor_token": anchor_token,
        "lineage_checkpoint_hints": {"anchored_at": now},
        "assistant_notes": ["sqlite_lineage_runtime_anchor: persistência parcial opcional."],
    }


def sqlite_lineage_runtime_stub(replay_ref: str) -> dict[str, Any]:
    return {
        "replay_ref": replay_ref,
        "lineage_checkpoint_hints": {},
        "assistant_notes": ["sqlite_lineage_runtime_stub: use anchor para persistir."],
        "deterministic_alignment": {"token": f"lineage-{replay_ref}"},
    }
