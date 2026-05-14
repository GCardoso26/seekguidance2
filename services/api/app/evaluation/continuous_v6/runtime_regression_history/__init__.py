"""Histórico de regressão de runtime."""

from __future__ import annotations

from typing import Any


def runtime_regression_history_stub(scores: list[float]) -> dict[str, Any]:
    return {
        "points": len(scores),
        "last": scores[-1] if scores else 0.0,
        "assistant_notes": ["Histórico para intelligence de regressão; não é veredicto único."],
    }
