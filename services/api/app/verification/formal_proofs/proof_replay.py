"""Ligação entre provas formais e replay determinístico."""

from __future__ import annotations

from typing import Any

from app.runtime.replay.replay_validation import validate_replay


def replay_proof_certificate(payload: dict[str, Any], *, runs: int = 3) -> dict[str, Any]:
    base = validate_replay(payload, runs=runs)
    certified = bool(base.get("deterministic"))
    return {
        **base,
        "certified": certified,
        "proof_kind": "deterministic_replay_stub",
    }
