"""Diagnósticos de divergência entre runtimes."""

from __future__ import annotations

from typing import Any


def runtime_divergence_diagnostics_v5_stub(a: str, b: str) -> dict[str, Any]:
    return {
        "pair": [a, b],
        "runtime_divergence_diagnostics": a != b,
        "assistant_notes": ["Comparar explicações assistentes, não apenas flags binários."],
    }
