"""Validação formal SEGOC (Yu-Gi-Oh!)."""

from __future__ import annotations

from typing import Any


def segoc_formal_validation_payload(mandatory_first: bool) -> dict[str, Any]:
    return {
        "mandatory_first": mandatory_first,
        "legality_reasoning": ["Ordenação SEGOC como constraints explícitas."],
        "proof_steps": [{"step": 1, "action": "order_segoc"}],
        "assistant_notes": ["Competitivo YGO: validar sempre com documentação oficial."],
        "timing_certificate": mandatory_first,
    }
