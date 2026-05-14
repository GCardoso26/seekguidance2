"""Previsão de carga de runtime."""

from __future__ import annotations

from typing import Any


def runtime_load_prediction_stub(series: list[float]) -> dict[str, Any]:
    return {"series_len": len(series), "assistant_notes": ["Predição heurística; integrar modelo externo depois."]}
