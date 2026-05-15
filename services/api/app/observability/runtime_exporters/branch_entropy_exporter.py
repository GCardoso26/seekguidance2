"""branch_entropy_exporter — exportação operacional (stub)."""

from __future__ import annotations

from typing import Any


def branch_entropy_exporter_stub(scope: str) -> dict[str, Any]:
    return {
        "scope": scope,
        "otel_scope": "tcg_judge.branch_entropy_exporter",
        "prometheus_prefix": "tcg_judge_branch_entropy_exporter",
        "assistant_notes": ["Métricas PII-free; lineage/replay apenas como labels agregados."],
        "replay_lineage_trace_hint": True,
    }
