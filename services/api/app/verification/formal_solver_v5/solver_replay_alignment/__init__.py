"""Alinhamento solver↔replay (v5)."""

from __future__ import annotations

from typing import Any


def solver_replay_alignment_v5_payload(solver: str, replay: str) -> dict[str, Any]:
    agree = solver == replay
    return {
        "agree": agree,
        "legality_reasoning": ["Claims resumidos comparados na camada assistente."],
        "proof_steps": [{"step": 1, "action": "diff_summary"}],
        "assistant_notes": ["Desacordo não implica erro de juiz automaticamente."],
        "replay_legality_certificate": agree,
    }
