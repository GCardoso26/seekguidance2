"""UNSAT semântico (narrativa verificável)."""

from __future__ import annotations

from typing import Any


def unsat_semantic_reasoning_payload(topic: str) -> dict[str, Any]:
    return {
        "unsat": True,
        "topic": topic,
        "legality_reasoning": [f"Incompatibilidade semântica em «{topic}» no escopo local."],
        "proof_steps": [{"step": 1, "action": "semantic_conflict"}],
        "assistant_notes": ["Contradiction certificate assistente; revisão humana recomendada."],
        "contradiction_certificate": True,
    }
