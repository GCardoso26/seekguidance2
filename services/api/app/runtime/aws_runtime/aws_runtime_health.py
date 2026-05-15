"""Saúde do runtime AWS (stub operacional)."""

from __future__ import annotations

from typing import Any

from app.runtime.aws_runtime.aws_runtime_config import aws_runtime_config_stub


def aws_runtime_health_stub(scope: str) -> dict[str, Any]:
    cfg = aws_runtime_config_stub(scope)
    return {
        "status": "nominal_stub",
        "scope": scope,
        "assistant_notes": ["aws_runtime_health: probes opcionais; sem chamadas reais a APIs."],
        "operational_hints": cfg["operational_hints"],
        "replay_alignment": cfg["replay_alignment"],
        "deterministic_runtime_notes": cfg["deterministic_runtime_notes"],
        "deployment_constraints": cfg["deployment_constraints"],
        "runtime_confidence": cfg["runtime_confidence"],
    }
