"""Observabilidade AWS — CloudWatch / OTLP opcionais (stub)."""

from __future__ import annotations

from typing import Any


def aws_runtime_observability_stub(scope: str) -> dict[str, Any]:
    return {
        "scope": scope,
        "otel_span_prefix": "tcg_judge.aws_runtime",
        "assistant_notes": [
            "aws_runtime_observability: nomes OTEL-safe; sem PII em labels.",
        ],
        "operational_hints": {"cloudwatch": {"optional": True}, "otlp_collector": {"optional": True}},
        "replay_alignment": {"trace_correlation": f"otel-{scope}"},
        "deterministic_runtime_notes": ["Traces agregados; replay slice-bound."],
        "deployment_constraints": {"exporter_sidecar_optional": True},
        "runtime_confidence": 0.74,
    }
