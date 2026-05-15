"""Configuração AWS híbrida — opcional, sem boto3 obrigatório."""

from __future__ import annotations

from typing import Any

_AWS_HINTS: dict[str, Any] = {
    "ecs_fargate": {"optional": True, "explainability": "hints_only"},
    "eks": {"optional": True},
    "sqs": {"optional": True},
    "elasticache": {"optional": True},
    "cloudwatch": {"optional": True},
    "otlp_collector": {"optional": True},
}


def aws_runtime_config_stub(scope: str) -> dict[str, Any]:
    return {
        "scope": scope,
        "assistant_notes": [
            "aws_runtime_config: integração cloud opcional; juiz mantém premissas locais.",
        ],
        "operational_hints": _AWS_HINTS,
        "replay_alignment": {"deterministic_token": f"arc-{scope}"},
        "deterministic_runtime_notes": ["Sem lock-in; reasoning_v1…v11 inalterados."],
        "deployment_constraints": {"heavy_deps": False, "boto3_required": False},
        "runtime_confidence": 0.72,
    }
