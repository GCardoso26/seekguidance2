"""Diagnósticos de fugas de normalização (soft, não equivalência forte)."""

from __future__ import annotations

from typing import Any


def normalization_leak_diagnostics_v5_stub(signals: list[str]) -> dict[str, Any]:
    return {
        "signals": signals,
        "normalization_leak_diagnostics": {"count": len(signals)},
        "assistant_notes": ["Detectar vazamentos de hipóteses, não forçar equivalência entre TCGs."],
    }
