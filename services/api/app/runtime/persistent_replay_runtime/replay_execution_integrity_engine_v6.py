"""replay_execution_integrity_engine_v6 — SHA256, consistency, repair hints."""

from __future__ import annotations

import hashlib
import json
from collections.abc import Mapping
from typing import Any

from app.runtime.persistent_replay_runtime.replay_execution_core_v6 import (
    execute_deterministic_replay_runtime,
    restore_replay_checkpoint_runtime,
)


def integrity_hash(payload: Mapping[str, Any]) -> str:
    raw = json.dumps(dict(payload), sort_keys=True)
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def verify_replay_integrity(
    replay_ref: str,
    payload: Mapping[str, Any] | None = None,
    *,
    storage_path: str | None = None,
) -> dict[str, Any]:
    executed = execute_deterministic_replay_runtime(
        replay_ref, payload, storage_path=storage_path
    )
    restore = restore_replay_checkpoint_runtime(replay_ref, storage_path=storage_path)
    digest = integrity_hash({"replay_ref": replay_ref, "executed": executed})
    checkpoint_ok = bool(restore.get("integrity_ok") or restore.get("restored"))
    score = 0.95 if checkpoint_ok else 0.72
    corruption = not checkpoint_ok and restore.get("restored") is False
    return {
        "replay_ref": replay_ref,
        "integrity_hash": digest,
        "consistency_score": score,
        "checkpoint_ok": checkpoint_ok,
        "corruption_detected": corruption,
        "repair_hints": (
            ["restore_checkpoint", "rebuild_journal"]
            if corruption
            else ["none_required"]
        ),
        "executed": executed,
        "restore": restore,
    }


def replay_execution_integrity_engine_v6_stub(
    replay_ref: str,
    *,
    storage_path: str | None = None,
) -> dict[str, Any]:
    report = verify_replay_integrity(replay_ref, {}, storage_path=storage_path)
    return {
        "scope": replay_ref,
        "storage_path": storage_path or "default",
        "assistant_notes": ["replay_execution_integrity_engine_v6: auditável v10."],
        "deterministic_alignment": report["executed"].get("deterministic_alignment", {}),
        "runtime_confidence": report["consistency_score"],
        "replay_summary": report["executed"],
        "lineage_summary": report["restore"],
        "divergence_summary": {"corruption": report["corruption_detected"]},
        "governance_summary": {"integrity_hash": report["integrity_hash"]},
        "lifecycle_summary": {},
        "operational_notes": report["repair_hints"],
        "replay_execution_summary": report,
        "integrity_score": report["consistency_score"],
        "integrity_hints": report["repair_hints"],
    }
