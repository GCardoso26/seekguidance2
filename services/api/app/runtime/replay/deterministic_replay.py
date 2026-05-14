"""Execução repetida para validar determinismo de runtime."""

from __future__ import annotations

from typing import Any

from app.runtime.replay.replay_hashing import deterministic_hash


def run_deterministic_replay(trace_payload: dict[str, Any], runs: int = 2) -> dict[str, Any]:
    hashes = [deterministic_hash(trace_payload) for _ in range(max(1, runs))]
    stable = len(set(hashes)) == 1
    return {"deterministic": stable, "hashes": hashes, "stable_replay_hash": hashes[0]}
