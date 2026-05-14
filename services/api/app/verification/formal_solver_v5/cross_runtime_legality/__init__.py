"""Legalidade cross-runtime (solver vs replay, v5)."""

from __future__ import annotations

from typing import Any


def cross_runtime_legality_v5_payload(solver_hash: str, replay_hash: str) -> dict[str, Any]:
    aligned = solver_hash == replay_hash
    return {
        "aligned": aligned,
        "legality_reasoning": ["Alinhamento por hash resumido de estado."],
        "proof_steps": [{"step": 1, "action": "compare_runtime_hashes"}],
        "assistant_notes": ["Desalinhamento aciona replay governance + observabilidade."],
        "replay_legality_certificate": aligned,
    }
