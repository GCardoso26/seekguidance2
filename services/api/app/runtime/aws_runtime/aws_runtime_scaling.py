"""Scaling hints ECS/EKS (stub, opcional)."""

from __future__ import annotations

from typing import Any


def aws_runtime_scaling_stub(scope: str) -> dict[str, Any]:
    return {
        "scope": scope,
        "assistant_notes": ["aws_runtime_scaling: políticas declarativas; juiz valida custo/replay."],
        "operational_hints": {"ecs_fargate": {"desired_count_hint": 1}},
        "replay_alignment": {"burst_safe": True},
        "deterministic_runtime_notes": ["Escalonamento não altera semântica de replay."],
        "deployment_constraints": {"autoscaling_required": False},
        "runtime_confidence": 0.7,
    }
