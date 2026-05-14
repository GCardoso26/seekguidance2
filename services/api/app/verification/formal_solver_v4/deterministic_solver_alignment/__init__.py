"""Alinhamento determinístico solver vs expectativa."""

from __future__ import annotations

from typing import Any


def deterministic_solver_alignment_stub(expected_hash: str, observed_hash: str) -> dict[str, Any]:
    match = expected_hash == observed_hash
    return {
        "match": match,
        "legality_reasoning": ["Alinhamento por hash de estado resumido (não CNF)."],
        "proof_steps": [{"step": 1, "action": "hash_compare"}],
        "assistant_notes": ["Hashes são metadados de replay governance."],
        "replay_legality_summary": "Determinismo consistente." if match else " Divergência determinística.",
    }
