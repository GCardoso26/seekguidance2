"""Métricas de pipelines semânticos."""

from __future__ import annotations

from typing import Any


def semantic_pipeline_metrics_stub(pipeline: str, latency_ms: float) -> dict[str, Any]:
    return {
        "pipeline": pipeline,
        "latency_ms": latency_ms,
        "assistant_notes": ["Expor counters por reasoning_v* sem colapsar pipelines legados."],
    }
