"""runtime_lifecycle_engine_v10 — state machine in-memory + snapshots."""

from __future__ import annotations

import json
import threading
import time
from pathlib import Path
from typing import Any

from app.runtime.production_runtime.runtime_execution_core_v9 import execution_snapshot

_STATES: dict[str, str] = {}
_TRANSITIONS: list[dict[str, Any]] = []
_LOCK = threading.Lock()
_VALID = frozenset({"idle", "queued", "running", "completed", "failed", "deadletter"})


def transition_lifecycle(scope: str, target: str, *, reason: str = "") -> dict[str, Any]:
    if target not in _VALID:
        target = "failed"
    with _LOCK:
        prev = _STATES.get(scope, "idle")
        _STATES[scope] = target
        entry = {
            "scope": scope,
            "from": prev,
            "to": target,
            "reason": reason,
            "at": time.time(),
        }
        _TRANSITIONS.append(entry)
    return entry


def lifecycle_snapshot_v10(scope: str) -> dict[str, Any]:
    with _LOCK:
        state = _STATES.get(scope, "idle")
        recent = [t for t in _TRANSITIONS if t["scope"] == scope][-8:]
    exec_snap = execution_snapshot()
    return {
        "scope": scope,
        "state": state,
        "transitions": recent,
        "execution": exec_snap,
        "integrity_ok": state not in ("failed", "deadletter"),
    }


def persist_lifecycle_snapshot(scope: str, *, storage_path: str | None = None) -> Path:
    root = Path(storage_path) if storage_path else Path("generated/runtime_artifacts/lifecycle")
    root.mkdir(parents=True, exist_ok=True)
    path = root / f"{scope}.lifecycle.json"
    path.write_text(json.dumps(lifecycle_snapshot_v10(scope), indent=2) + "\n", encoding="utf-8")
    return path


def runtime_lifecycle_engine_v10_stub(scope: str, *, storage_path: str | None = None) -> dict[str, Any]:
    if scope not in _STATES:
        transition_lifecycle(scope, "idle")
    snap = lifecycle_snapshot_v10(scope)
    persist_lifecycle_snapshot(scope, storage_path=storage_path)
    conf = 0.9 if snap["integrity_ok"] else 0.65
    return {
        "scope": scope,
        "storage_path": storage_path or "default",
        "assistant_notes": ["runtime_lifecycle_engine_v10: state machine v10."],
        "deterministic_alignment": {"token": f"life10-{scope}", "state": snap["state"]},
        "runtime_confidence": conf,
        "replay_summary": {},
        "lineage_summary": {"transitions": len(snap["transitions"])},
        "divergence_summary": {},
        "governance_summary": snap,
        "lifecycle_summary": snap,
        "operational_notes": [f"state={snap['state']}"],
        "execution_summary": snap.get("execution", {}),
        "lifecycle_state": snap["state"],
        "retry_count": snap.get("execution", {}).get("retry_tracked", 0),
    }
