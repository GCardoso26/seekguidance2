"""Checkpoint SQLite runtime v2."""

from __future__ import annotations

from collections.abc import Mapping
from typing import Any

from app.runtime.persistent_replay_runtime.sqlite_checkpoint_runtime import (
    sqlite_checkpoint_runtime_write,
)


def replay_checkpoint_sqlite_runtime_v2_stub(
    checkpoint_id: str,
    payload: Mapping[str, Any] | None = None,
    *,
    storage_path: str | None = None,
) -> dict[str, Any]:
    ck = sqlite_checkpoint_runtime_write(
        checkpoint_id,
        dict(payload or {}),
        storage_path=storage_path,
    )
    return {
        "scope": checkpoint_id,
        "storage_path": storage_path or "default",
        "assistant_notes": ["replay_checkpoint_sqlite_runtime_v2: checkpoint opcional."],
        "deterministic_alignment": {"token": f"ck-{checkpoint_id}"},
        "runtime_confidence": 0.85,
        "replay_summary": ck,
        "lineage_summary": {},
        "operational_hints": {},
        "replay_execution_token": ck.get("deterministic_alignment", {}).get("token", "stub"),
        "replay_checkpoint_summary": ck,
        "replay_integrity_score": 0.85,
        "temporal_consistency": {"bounded": True},
    }
