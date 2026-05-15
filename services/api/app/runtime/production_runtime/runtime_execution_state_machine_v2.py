"""runtime_execution_state_machine_v2 — transições determinísticas."""

from __future__ import annotations

from typing import Any

from app.runtime.production_runtime.runtime_lifecycle_engine_v10 import (
    lifecycle_snapshot_v10,
    transition_lifecycle,
)

_ALLOWED: dict[str, frozenset[str]] = {
    "idle": frozenset({"queued"}),
    "queued": frozenset({"running", "deadletter"}),
    "running": frozenset({"completed", "failed", "deadletter"}),
    "failed": frozenset({"queued", "idle"}),
    "completed": frozenset({"idle"}),
    "deadletter": frozenset({"idle"}),
}


def apply_transition(scope: str, target: str) -> dict[str, Any]:
    snap = lifecycle_snapshot_v10(scope)
    current = snap["state"]
    if target not in _ALLOWED.get(current, frozenset()):
        return {"accepted": False, "from": current, "to": target}
    entry = transition_lifecycle(scope, target, reason="state_machine_v2")
    return {"accepted": True, **entry}


def runtime_execution_state_machine_v2_stub(scope: str, *, storage_path: str | None = None) -> dict[str, Any]:
    apply_transition(scope, "queued")
    snap = lifecycle_snapshot_v10(scope)
    return {
        "scope": scope,
        "storage_path": storage_path or "default",
        "assistant_notes": ["runtime_execution_state_machine_v2: transitions v10."],
        "deterministic_alignment": {"token": f"sm2-{scope}", "state": snap["state"]},
        "runtime_confidence": 0.88,
        "replay_summary": {},
        "lineage_summary": {},
        "divergence_summary": {},
        "governance_summary": snap,
        "lifecycle_summary": snap,
        "operational_notes": [],
        "execution_summary": {},
        "lifecycle_state": snap["state"],
        "retry_count": 0,
    }
