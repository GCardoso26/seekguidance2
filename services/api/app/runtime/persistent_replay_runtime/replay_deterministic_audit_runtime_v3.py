"""replay_deterministic_audit_runtime_v3 — audit determinístico RC."""

from __future__ import annotations

import hashlib
import json
from collections.abc import Mapping
from typing import Any

from app.runtime.persistent_replay_runtime.replay_execution_core_v6 import (
    append_replay_execution_journal,
    restore_replay_checkpoint_runtime,
)
from app.runtime.persistent_replay_runtime.replay_execution_integrity_engine_v6 import (
    verify_replay_integrity,
)


def audit_replay_determinism(
    replay_ref: str,
    payload: Mapping[str, Any] | None = None,
    *,
    storage_path: str | None = None,
) -> dict[str, Any]:
    integrity = verify_replay_integrity(replay_ref, payload, storage_path=storage_path)
    journal = append_replay_execution_journal(replay_ref, "audit_v3", storage_path=storage_path)
    restore = restore_replay_checkpoint_runtime(replay_ref, storage_path=storage_path)
    trace_token = hashlib.sha256(
        json.dumps({"ref": replay_ref, "h": integrity["integrity_hash"]}, sort_keys=True).encode()
    ).hexdigest()[:20]
    audit_score = (integrity["consistency_score"] + (0.95 if journal.get("journal_path") else 0.7)) / 2.0
    return {
        "replay_ref": replay_ref,
        "audit_score": round(audit_score, 4),
        "trace_token": trace_token,
        "integrity": integrity,
        "journal": journal,
        "restore": restore,
        "rollback_traceable": bool(restore.get("restored") or restore.get("integrity_ok")),
        "repair_hints": integrity.get("repair_hints", []),
    }


def replay_deterministic_audit_runtime_v3_stub(
    replay_ref: str,
    *,
    storage_path: str | None = None,
) -> dict[str, Any]:
    report = audit_replay_determinism(replay_ref, {}, storage_path=storage_path)
    return {
        "scope": replay_ref,
        "storage_path": storage_path or "default",
        "assistant_notes": ["replay_deterministic_audit_runtime_v3: auditável RC."],
        "deterministic_alignment": {"token": report["trace_token"]},
        "runtime_confidence": report["audit_score"],
        "replay_summary": report["integrity"]["executed"],
        "lineage_summary": report["journal"],
        "divergence_summary": {"rollback_traceable": report["rollback_traceable"]},
        "governance_summary": report,
        "lifecycle_summary": {},
        "operational_notes": report["repair_hints"],
        "replay_execution_summary": report,
        "audit_score": report["audit_score"],
        "integrity_hints": report["repair_hints"],
    }
