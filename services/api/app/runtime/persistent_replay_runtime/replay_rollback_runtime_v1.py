"""replay_rollback_runtime_v1 — rollback via restore."""

from __future__ import annotations

from typing import Any

from app.runtime.persistent_replay_runtime.replay_execution_core_v6 import (
    restore_replay_checkpoint_runtime,
)


def replay_rollback_runtime_v1_stub(
    replay_ref: str,
    *,
    storage_path: str | None = None,
) -> dict[str, Any]:
    restored = restore_replay_checkpoint_runtime(replay_ref, storage_path=storage_path)
    return {
        "scope": replay_ref,
        "storage_path": storage_path or "default",
        "assistant_notes": ["replay_rollback_runtime_v1: rollback parcial."],
        "deterministic_alignment": {"token": f"rb-{replay_ref}"},
        "runtime_confidence": 0.86,
        "replay_summary": restored,
        "lineage_summary": {},
        "divergence_summary": {},
        "operational_notes": [],
        "replay_integrity_summary": {"rolled_back": restored.get("restored", False)},
        "deterministic_replay_audit": {},
        "replay_integrity_score": 0.85,
        "temporal_integrity_summary": {},
        "replay_integrity_notes": ["rollback"],
    }
