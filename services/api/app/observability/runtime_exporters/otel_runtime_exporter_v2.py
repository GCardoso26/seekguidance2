"""otel_runtime_exporter_v2 — exportação operacional (stub)."""

from __future__ import annotations

from typing import Any


def otel_runtime_exporter_v2_stub(scope: str) -> dict[str, Any]:
    return {
        "scope": scope,
        "otel_scope": "tcg_judge.otel_runtime_exporter_v2",
        "prometheus_prefix": "tcg_judge_otel_runtime_exporter_v2",
        "assistant_notes": ["Métricas PII-free; lineage/replay apenas como labels agregados."],
        "replay_lineage_trace_hint": True,
    }
