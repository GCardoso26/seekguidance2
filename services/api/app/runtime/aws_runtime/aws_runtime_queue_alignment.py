"""Filas SQS / DLQ — alinhamento com replay (stub)."""

from __future__ import annotations

from typing import Any


def aws_runtime_queue_alignment_stub(scope: str) -> dict[str, Any]:
    return {
        "scope": scope,
        "assistant_notes": ["aws_runtime_queue_alignment: backpressure explainable; sem motor jurídico."],
        "operational_hints": {"sqs": {"optional": True}, "dlq_depth_metric": "tcg_judge_dlq_depth"},
        "replay_alignment": {"enqueue_token": f"q-{scope}"},
        "deterministic_runtime_notes": ["Mensagens carregam apenas refs de replay compactas."],
        "deployment_constraints": {"local_queue_fallback": True},
        "runtime_confidence": 0.69,
    }
