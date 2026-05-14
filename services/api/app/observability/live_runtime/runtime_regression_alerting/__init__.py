"""Alertas de regressão de runtime (live)."""

from __future__ import annotations

from typing import Any


def runtime_regression_alerting_stub(severity: str) -> dict[str, Any]:
    return {"severity": severity, "assistant_notes": ["Alertas Prometheus/OTEL; ver infra/observability."]}
