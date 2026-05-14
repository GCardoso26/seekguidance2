"""Monitorização do solver em runtime."""

from __future__ import annotations

from typing import Any


def solver_runtime_monitoring_stub(latency_ms: float, budget_ms: float) -> dict[str, Any]:
    return {"over_budget": latency_ms > budget_ms, "latency_ms": latency_ms}
