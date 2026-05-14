"""Validação formal de cadeias (precedência, timing, dependências)."""

from __future__ import annotations

from typing import Any

from app.reasoning.contradictions.contradiction_detector import detect_contradictions


def validate_formal_chain(roles: list[str], game_slug: str, timing: dict[str, Any]) -> dict[str, Any]:
    window = timing.get("window")
    w = window if isinstance(window, str) else None
    contras = detect_contradictions(roles, w, game_slug)
    preced_ok = not any(x["type"] == "ordering_violation" for x in contras)
    timing_ok = not any(x["type"] == "timing_requirement_unmet" for x in contras)
    dep_ok = not any("circular" in x["type"] for x in contras)
    mutex_ok = not any(x["type"] == "mutually_exclusive_roles" for x in contras)
    score = 1.0
    for x in contras:
        if x.get("severity") == "critical":
            score -= 0.18
        elif x.get("severity") == "high":
            score -= 0.1
    chain_valid = len(contras) == 0
    return {
        "chain_valid": chain_valid,
        "validation_score": max(0.0, min(1.0, score)),
        "timing_legal": timing_ok,
        "precedence_legal": preced_ok and dep_ok,
        "dependency_valid": dep_ok and mutex_ok,
        "constraint_violations": contras,
    }
