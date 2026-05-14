"""Validação agregada de replay determinístico."""

from __future__ import annotations

from typing import Any

from app.runtime.replay.deterministic_replay import run_deterministic_replay


def validate_replay(payload: dict[str, Any], runs: int = 3) -> dict[str, Any]:
    out = run_deterministic_replay(payload, runs=runs)
    return {
        "deterministic": bool(out["deterministic"]),
        "stable_replay_hash": str(out["stable_replay_hash"]),
        "mutation_consistency": 1.0 if out["deterministic"] else 0.0,
    }
