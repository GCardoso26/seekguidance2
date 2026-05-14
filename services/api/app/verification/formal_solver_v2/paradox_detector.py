"""Paradoxos: linguagem de assistente."""

from __future__ import annotations

from typing import Any


def paradox_assistant_hint(contradictory_flags: dict[str, bool]) -> dict[str, Any]:
    active = [k for k, v in contradictory_flags.items() if v]
    return {
        "paradox_risk": len(active) > 1,
        "assistant_note": "Dois sinais conflituam; apresente ambos e peça prioridade de regra do jogo.",
        "flags": sorted(active),
    }
