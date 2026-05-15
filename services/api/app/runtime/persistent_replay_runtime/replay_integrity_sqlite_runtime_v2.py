"""Integrity store SQLite runtime v2."""

from __future__ import annotations

from typing import Any

from app.runtime.persistent_replay_runtime.sqlite_runtime_integrity_store_v2 import (
    sqlite_runtime_integrity_store_v2_put,
)


def replay_integrity_sqlite_runtime_v2_stub(
    artifact_ref: str,
    *,
    storage_path: str | None = None,
) -> dict[str, Any]:
    rec = sqlite_runtime_integrity_store_v2_put(
        artifact_ref,
        {"artifact_ref": artifact_ref},
        storage_path=storage_path,
    )
    return {
        "scope": artifact_ref,
        "storage_path": storage_path or "default",
        "assistant_notes": ["replay_integrity_sqlite_runtime_v2: hash registry opcional."],
        "deterministic_alignment": {"token": rec.get("integrity_hash", "stub")},
        "runtime_confidence": 0.85,
        "replay_summary": {},
        "lineage_summary": {},
        "operational_hints": {},
        "replay_execution_token": rec.get("integrity_hash", "stub"),
        "replay_checkpoint_summary": {},
        "replay_integrity_score": 0.86,
        "temporal_consistency": {"bounded": True},
    }
