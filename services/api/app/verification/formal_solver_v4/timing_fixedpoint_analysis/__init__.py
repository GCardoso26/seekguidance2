"""Análise de ponto fixo de timing."""

from __future__ import annotations

from typing import Any


def timing_fixedpoint_analysis_stub(events: list[str]) -> dict[str, Any]:
    return {
        "events": events,
        "legality_reasoning": ["Procura de ordem estável sob repetição de tick sintético."],
        "proof_steps": [{"step": i + 1, "event": e} for i, e in enumerate(events[:5])],
        "assistant_notes": ["Simultaneous triggers: explicar, não forçar SAT bruto."],
        "replay_legality_summary": "Ponto fixo parcial ou ausente dentro do stub.",
    }
