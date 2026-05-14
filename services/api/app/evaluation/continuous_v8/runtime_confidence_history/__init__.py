"""Histórico de confiança de runtime."""

from __future__ import annotations

from typing import Any


def runtime_confidence_history_v8_stub(samples: int = 10) -> dict[str, Any]:
    return {
        "samples": samples,
        "operational_confidence_runtime": [{"i": i, "c": 0.85} for i in range(samples)],
        "assistant_notes": ["Confiança operacional, não veredicto legal."],
    }
