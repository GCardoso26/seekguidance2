"""Archive filesystem runtime v2 (stdlib)."""

from __future__ import annotations

from collections.abc import Mapping
from pathlib import Path
from typing import Any

from app.runtime.persistent_replay_runtime.filesystem_replay_archive import (
    filesystem_archive_write,
)


def replay_archive_filesystem_runtime_v2_stub(
    archive_ref: str,
    payload: Mapping[str, Any] | None = None,
    *,
    storage_path: str | None = None,
) -> dict[str, Any]:
    root = Path(storage_path) if storage_path else None
    meta = filesystem_archive_write(archive_ref, dict(payload or {}), root=root)
    return {
        "scope": archive_ref,
        "storage_path": storage_path or "default",
        "assistant_notes": ["replay_archive_filesystem_runtime_v2: archive opcional."],
        "deterministic_alignment": {"token": meta.get("integrity_hash", "stub")},
        "runtime_confidence": 0.85,
        "replay_summary": meta,
        "lineage_summary": {},
        "operational_hints": {"format": "json"},
        "replay_execution_token": meta.get("integrity_hash", "stub"),
        "replay_checkpoint_summary": {},
        "replay_integrity_score": 0.85,
        "temporal_consistency": {"bounded": True},
    }
