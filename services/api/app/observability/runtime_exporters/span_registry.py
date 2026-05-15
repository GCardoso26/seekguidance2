"""Registo canónico de spans OTEL (nomes estáveis)."""

from __future__ import annotations


def otel_span_registry() -> dict[str, str]:
    return {
        "replay_validate": "tcg_judge.replay.validate",
        "replay_lineage": "tcg_judge.replay.lineage",
        "replay_diff": "tcg_judge.replay.diff",
        "replay_reconcile": "tcg_judge.replay.reconcile",
        "replay_runtime_summary": "tcg_judge.replay.runtime_summary",
        "mobile_sync": "tcg_judge.mobile.sync",
    }


def span_namespace_governance_stub() -> dict[str, list[str]]:
    return {
        "assistant_notes": ["span_registry: nomes OTEL-safe; sem dados sensíveis em atributos."],
        "families": list(otel_span_registry().values()),
    }
