"""Ponto fixo de replacement / recursão substitutiva (bounded)."""

from __future__ import annotations

from typing import Any


def replacement_fixedpoint_stub(chain: list[str], max_depth: int) -> dict[str, Any]:
    depth = min(len(chain), max_depth)
    return {
        "max_depth": max_depth,
        "legality_reasoning": [
            "Replacement avaliado como iteração com teto; loops latentes são sinalizados, não silenciados.",
        ],
        "proof_steps": [{"step": i + 1, "layer": c} for i, c in enumerate(chain[:depth])],
        "assistant_notes": [
            "MTG replacement layers e analogias em outros TCGs não colapsam em equivalência forte."
        ],
        "replay_legality_summary": "Convergência parcial ou risco de loop dentro do orçamento de profundidade.",
    }
