"""Replacement fixed-point runtime (bounded)."""

from __future__ import annotations

from typing import Any


def replacement_fixedpoint_runtime_payload(chain_len: int, cap: int) -> dict[str, Any]:
    return {
        "chain_len": chain_len,
        "cap": cap,
        "legality_reasoning": ["Ponto fixo truncado; loops paradoxais sinalizados."],
        "proof_steps": [{"step": 1, "action": "iterate_replacement"}],
        "assistant_notes": ["Recursion Yu-Gi-Oh!/MTG mantém semânticas distintas."],
        "branch_explosion_safeguards": chain_len <= cap,
    }
