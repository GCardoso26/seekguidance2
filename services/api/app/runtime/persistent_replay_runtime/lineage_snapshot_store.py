"""Persistência de âncoras de lineage (SQLite partilhado opcional)."""

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


def lineage_write_anchor(
    replay_lineage_id: str,
    replay_ref: str,
    anchor_token: str,
    metadata: Mapping[str, Any] | None = None,
    *,
    root: Path | None = None,
) -> dict[str, Any]:
    root = root or default_sqlite_store_root()
    db_path = root / "snapshots.db"
    now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    meta_json = json.dumps(dict(metadata or {}), sort_keys=True, separators=(",", ":"))
    conn = connect_replay_sqlite(db_path)
    try:
        conn.execute(
            """
            INSERT INTO replay_lineage_anchor (replay_lineage_id, replay_ref, anchor_token, metadata_json, created_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (replay_lineage_id, replay_ref, anchor_token, meta_json, now),
        )
        conn.commit()
        return {
            "replay_lineage_id": replay_lineage_id,
            "replay_ref": replay_ref,
            "anchor_token": anchor_token,
            "assistant_notes": ["lineage_snapshot_store: append-only; merge assistido."],
        }
    finally:
        conn.close()
