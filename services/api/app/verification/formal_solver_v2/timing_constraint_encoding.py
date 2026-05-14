"""Encoding de timing para diagnóstico do assistente."""

from __future__ import annotations

from typing import Any


def encode_timing_for_assistant(windows: list[str]) -> dict[str, Any]:
    return {
        "windows": sorted(windows),
        "assistant_note": "Confirme a janela ativa com a ordem de turno do TCG atual.",
    }
