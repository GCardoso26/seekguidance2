"""Paradoxos — certificado UNSAT explicável."""

from __future__ import annotations

from typing import Any


def paradox_certificate(contradictory: bool, *, source: str = "mixed_signals") -> dict[str, Any]:
    return {
        "contradictory": contradictory,
        "contradiction_source": source if contradictory else None,
        "unsat_explanation": "Dois sinais não podem ser verdadeiros ao mesmo tempo neste modelo."
        if contradictory
        else None,
        "assistant_safe": True,
    }
