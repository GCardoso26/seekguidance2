"""Provas de consistência de timing (bounded)."""

from __future__ import annotations

from typing import Any


def timing_proof_search_stub(events: list[str], depth_cap: int) -> dict[str, Any]:
    return {
        "events": events[:depth_cap],
        "depth_cap": depth_cap,
        "legality_reasoning": [
            "Ordem de resolução explorada até profundidade limitada; paradoxos reportados como hipóteses.",
        ],
        "proof_steps": [{"step": i + 1, "event": e} for i, e in enumerate(events[:depth_cap])],
        "assistant_notes": ["Simultaneous triggers / APNAP variam por TCG — soft normalization preservada."],
        "replay_legality_summary": "Sequência parcial consistente com o cap; expansão adicional requer novo orçamento.",
    }
