"""Legalidade de combat chain (FAB)."""

from __future__ import annotations

from typing import Any


def combat_chain_legality_v5_payload(reactions_open: bool) -> dict[str, Any]:
    return {
        "reactions_open": reactions_open,
        "legality_reasoning": ["Combat chain como sequência de janelas reativas."],
        "proof_steps": [{"step": 1, "action": "scan_chain"}],
        "assistant_notes": ["Não equiparar a stack genérico de outros TCGs."],
        "legality_certificate": reactions_open,
    }
