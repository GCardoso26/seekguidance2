"""Alertas operacionais móveis (stub)."""

from __future__ import annotations

from typing import Any


def mobile_runtime_alerting_stub(severity: str) -> dict[str, Any]:
    return {
        "severity": severity,
        "assistant_notes": ["Alertas explicáveis; sem spam de logs de PII."],
        "replay_summary": {"open_alerts": 1 if severity == "high" else 0},
        "deterministic_alignment": {"dedupe_key": f"alert-{severity}"},
        "lineage_replay_awareness": {"slice": "mra-v2"},
    }
