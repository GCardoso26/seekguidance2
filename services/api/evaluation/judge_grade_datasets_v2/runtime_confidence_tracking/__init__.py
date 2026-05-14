"""Confiança de runtime em pipelines de avaliação."""

from __future__ import annotations

from typing import Any


def runtime_confidence_stub(pipeline: str, score: float) -> dict[str, Any]:
    return {
        "pipeline": pipeline,
        "score": score,
        "assistant_notes": ["reasoning_v1…reasoning_v11 mantêm contratos; score é agregado assistente."],
    }
