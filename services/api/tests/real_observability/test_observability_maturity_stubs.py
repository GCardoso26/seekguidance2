"""Observability maturity stubs."""
from __future__ import annotations

from app.runtime.runtime_connected_observability.runtime_observability_retention_v1 import (
    runtime_observability_retention_v1_stub,
)
from app.runtime.runtime_connected_observability.runtime_operational_slo_engine_v2 import (
    runtime_operational_slo_engine_v2_stub,
)


def test_retention_stub() -> None:
    assert runtime_observability_retention_v1_stub("o")["observability_score"] > 0


def test_slo_engine_stub() -> None:
    assert runtime_operational_slo_engine_v2_stub("o")["observability_score"] > 0
