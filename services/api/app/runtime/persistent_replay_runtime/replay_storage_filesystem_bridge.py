"""Bridge filesystem para artefactos de replay (stub)."""

from __future__ import annotations

from typing import Any

from app.runtime.persistent_replay_runtime.contracts import StorageDialect


def replay_storage_filesystem_bridge_stub(replay_ref: str) -> dict[str, Any]:
    return {
        "replay_ref": replay_ref,
        "dialect": StorageDialect.FILESYSTEM.value,
        "consistency_summary": {"immutable_segments": True},
        "assistant_notes": ["replay_storage_filesystem_bridge: snapshots versionados por ref."],
    }
