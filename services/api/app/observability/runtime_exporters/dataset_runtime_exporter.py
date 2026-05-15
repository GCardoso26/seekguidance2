"""dataset_runtime_exporter — exportação operacional (stub)."""

from __future__ import annotations

from typing import Any


def dataset_runtime_exporter_stub(scope: str) -> dict[str, Any]:
    return {
        "scope": scope,
        "otel_scope": "tcg_judge.dataset_runtime_exporter",
        "prometheus_prefix": "tcg_judge_dataset_runtime_exporter",
        "assistant_notes": ["Métricas PII-free; lineage/replay apenas como labels agregados."],
        "replay_lineage_trace_hint": True,
    }
