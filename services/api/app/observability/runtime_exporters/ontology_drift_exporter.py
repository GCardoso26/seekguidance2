"""ontology_drift_exporter — exportação operacional (stub)."""

from __future__ import annotations

from typing import Any


def ontology_drift_exporter_stub(scope: str) -> dict[str, Any]:
    return {
        "scope": scope,
        "otel_scope": "tcg_judge.ontology_drift_exporter",
        "prometheus_prefix": "tcg_judge_ontology_drift_exporter",
        "assistant_notes": ["Métricas PII-free; lineage/replay apenas como labels agregados."],
        "replay_lineage_trace_hint": True,
    }
