"""replay_integrity_engine_v4 — integridade determinística."""

from __future__ import annotations

from collections.abc import Mapping
from pathlib import Path
from typing import Any

from app.runtime.persistent_replay_runtime.replay_execution_core_v6 import (
    execute_deterministic_replay_runtime,
)
from app.runtime.persistent_replay_runtime.sqlite_snapshot_store import sqlite_read_latest_snapshot


def score_replay_integrity(replay_ref: str, *, storage_path: str | None = None) -> dict[str, Any]:
    root = Path(storage_path) if storage_path else None
    snap = sqlite_read_latest_snapshot(replay_ref, root=root)
    ok = bool(snap and snap.get("integrity_ok"))
    return {
        "replay_ref": replay_ref,
        "replay_integrity_score": 0.9 if ok else 0.5,
        "integrity_ok": ok,
    }


def replay_integrity_engine_v4_stub(
    replay_ref: str,
    payload: Mapping[str, Any] | None = None,
    *,
    storage_path: str | None = None,
) -> dict[str, Any]:
    executed = execute_deterministic_replay_runtime(
        replay_ref,
        payload,
        storage_path=storage_path,
    )
    scored = score_replay_integrity(replay_ref, storage_path=storage_path)
    return {
        "scope": replay_ref,
        "storage_path": storage_path or "default",
        "assistant_notes": ["replay_integrity_engine_v4: integrity v7."],
        "deterministic_alignment": executed.get("deterministic_alignment", {}),
        "runtime_confidence": 0.87,
        "replay_summary": executed,
        "lineage_summary": {},
        "divergence_summary": {},
        "operational_notes": [],
        "replay_integrity_summary": scored,
        "deterministic_replay_audit": {"token": executed.get("replay_execution_token")},
        "replay_integrity_score": scored["replay_integrity_score"],
        "temporal_integrity_summary": {"bounded": True},
        "replay_integrity_notes": [],
    }
