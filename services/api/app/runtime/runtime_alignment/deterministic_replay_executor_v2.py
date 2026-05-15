"""Executor determinístico de replay (parcial, stdlib-first)."""

from __future__ import annotations

import hashlib
import json
from collections.abc import Mapping
from pathlib import Path
from typing import Any

from app.runtime.persistent_replay_runtime.sqlite_snapshot_store import (
    sqlite_write_snapshot,
)


def _replay_token(replay_ref: str, payload: Mapping[str, Any]) -> str:
    raw = json.dumps({"replay_ref": replay_ref, "payload": dict(payload)}, sort_keys=True)
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()[:24]


def deterministic_replay_executor_v2_stub(
    replay_ref: str,
    payload: Mapping[str, Any] | None = None,
    *,
    storage_path: str | None = None,
) -> dict[str, Any]:
    """Executa replay determinístico parcial com snapshot SQLite opcional."""
    body = dict(payload or {"replay_ref": replay_ref})
    root = Path(storage_path) if storage_path else None
    snap = sqlite_write_snapshot(replay_ref, body, root=root)
    token = _replay_token(replay_ref, body)
    return {
        "scope": replay_ref,
        "storage_path": storage_path or "default",
        "assistant_notes": [
            "deterministic_replay_executor_v2: token + snapshot opcional.",
        ],
        "deterministic_alignment": {"token": token},
        "runtime_confidence": 0.86,
        "replay_summary": {"snapshot": snap},
        "lineage_summary": {"replay_ref": replay_ref},
        "operational_hints": {"sqlite_optional": True},
        "replay_execution_token": token,
        "replay_checkpoint_summary": {"version": snap.get("version")},
        "replay_integrity_score": 0.86,
        "temporal_consistency": {"bounded": True},
    }
