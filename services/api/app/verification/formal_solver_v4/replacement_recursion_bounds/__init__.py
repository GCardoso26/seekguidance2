"""Limites explícitos de replacement recursion."""

from __future__ import annotations

from typing import Any


def replacement_recursion_bounds_stub(depth: int, cap: int) -> dict[str, Any]:
    return {
        "depth": depth,
        "cap": cap,
        "within_bounds": depth <= cap,
        "legality_reasoning": ["Recursão substitutiva truncada ao cap para prova assistente."],
        "proof_steps": [{"step": 1, "action": "measure_depth", "value": depth}],
        "assistant_notes": ["Loops paradoxais reportados, não escondidos."],
        "replay_legality_summary": "Encadeamento compatível com limite de profundidade.",
    }
