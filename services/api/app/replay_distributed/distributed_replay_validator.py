"""Validação de consistência de replay distribuído."""

from __future__ import annotations

from typing import Any

from app.distributed_state.deterministic_state_hashing import state_hash


def validate_replay_events(events: list[dict[str, Any]]) -> dict[str, Any]:
    ok = True
    reasons: list[str] = []
    prev = ""
    for i, ev in enumerate(events):
        snap = ev.get("state_snapshot") if isinstance(ev.get("state_snapshot"), dict) else {}
        if snap and ev.get("state_hash") != state_hash(snap):
            ok = False
            reasons.append(f"row_{i}_hash_mismatch")
        ph = str(ev.get("parent_state_hash", ""))
        if prev and ph != prev:
            ok = False
            reasons.append(f"row_{i}_parent_mismatch")
        prev = str(ev.get("state_hash", ""))
    return {"valid": ok, "reasons": reasons}
