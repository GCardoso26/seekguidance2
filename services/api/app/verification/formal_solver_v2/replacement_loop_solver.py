"""Replacement loops — diagnóstico para assistente."""

from __future__ import annotations

from typing import Any

from app.verification.formal_solver.replacement_loop_detection import detect_replacement_loop_hints


def replacement_loop_assistant(effects: list[str]) -> dict[str, Any]:
    tech = detect_replacement_loop_hints(effects)
    risk = bool(tech.get("loop_risk"))
    return {
        "loop_risk": risk,
        "assistant_note": "Sugira contar repetições e aplicar política anti-loop do TCG."
        if risk
        else "Sem padrão óbvio de loop nas etiquetas listadas.",
        "internal": tech,
    }
