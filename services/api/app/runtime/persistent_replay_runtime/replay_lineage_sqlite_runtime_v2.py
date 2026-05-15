"""Lineage anchor SQLite runtime v2."""

from __future__ import annotations

from collections.abc import Mapping
from pathlib import Path
from typing import Any

from app.runtime.persistent_replay_runtime.sqlite_lineage_runtime import (
    sqlite_lineage_runtime_anchor,
)


def replay_lineage_sqlite_runtime_v2_stub(
    lineage_id: str,
    replay_ref: str,
    metadata: Mapping[str, Any] | None = None,
    *,
    storage_path: str | None = None,
) -> dict[str, Any]:
    root = Path(storage_path) if storage_path else None
    anchor = sqlite_lineage_runtime_anchor(
        lineage_id,
        replay_ref,
        dict(metadata or {}),
        root=root,
    )
    return {
        "scope": lineage_id,
        "storage_path": storage_path or "default",
        "assistant_notes": ["replay_lineage_sqlite_runtime_v2: anchor opcional."],
        "deterministic_alignment": {"token": anchor.get("anchor_token", "stub")},
        "runtime_confidence": 0.85,
        "replay_summary": {},
        "lineage_summary": anchor,
        "operational_hints": {},
        "replay_execution_token": anchor.get("anchor_token", "stub"),
        "replay_checkpoint_summary": {},
        "replay_integrity_score": 0.85,
        "temporal_consistency": {"bounded": True},
    }
