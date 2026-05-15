"""Exportador OTEL/Prometheus para replay distribuído (stub opcional)."""

from __future__ import annotations

from typing import Any


def distributed_replay_otel_exporter_stub(scope: str) -> dict[str, Any]:
    return {
        "scope": scope,
        "otel_scope": "tcg_judge.distributed_replay_exporter",
        "prometheus_prefix": "tcg_judge_distributed_replay",
        "assistant_notes": ["distributed_replay_otel_exporter: opcional; sem dependência boto3."],
    }
