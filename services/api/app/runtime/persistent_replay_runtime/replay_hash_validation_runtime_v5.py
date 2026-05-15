"""replay_hash_validation_runtime_v5 — validação de hash."""

from __future__ import annotations

import hashlib
import json
from collections.abc import Mapping
from pathlib import Path
from typing import Any

from app.runtime.persistent_replay_runtime.sqlite_snapshot_store import sqlite_read_latest_snapshot


def validate_replay_hash(replay_ref: str, *, storage_path: str | None = None) -> dict[str, Any]:
    root = Path(storage_path) if storage_path else None
    snap = sqlite_read_latest_snapshot(replay_ref, root=root)
    if not snap:
        return {"valid": False, "replay_ref": replay_ref, "reason": "no_snapshot"}
    payload = snap.get("payload", {})
    raw = json.dumps(payload, sort_keys=True, separators=(",", ":"))
    recomputed = hashlib.sha256(raw.encode("utf-8")).hexdigest()
    ok = recomputed == snap.get("integrity_hash")
    return {
        "valid": ok,
        "replay_ref": replay_ref,
        "integrity_hash": snap.get("integrity_hash"),
        "recomputed_hash": recomputed,
    }


def replay_hash_validation_runtime_v5_stub(
    replay_ref: str,
    payload: Mapping[str, Any] | None = None,
    *,
    storage_path: str | None = None,
) -> dict[str, Any]:
    result = validate_replay_hash(replay_ref, storage_path=storage_path)
    score = 0.92 if result.get("valid") else 0.55
    return {
        "scope": replay_ref,
        "storage_path": storage_path or "default",
        "assistant_notes": ["replay_hash_validation_runtime_v5: hash v8."],
        "deterministic_alignment": {"token": f"hash5-{replay_ref}"},
        "runtime_confidence": score,
        "replay_summary": result,
        "lineage_summary": {},
        "divergence_summary": {},
        "governance_summary": {},
        "operational_notes": [],
        "replay_integrity_score": score,
        "integrity_validation_summary": result,
    }
