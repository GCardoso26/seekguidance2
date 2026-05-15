"""Performance maturity stubs."""
from __future__ import annotations

from app.runtime.performance_engineering.runtime_execution_cost_model_v1 import (
    runtime_execution_cost_model_v1_stub,
)
from app.runtime.performance_engineering.runtime_federation_balancing_engine_v5 import (
    runtime_federation_balancing_engine_v5_stub,
)


def test_cost_model() -> None:
    assert runtime_execution_cost_model_v1_stub("p")["performance_score"] > 0


def test_fed_balance_v5() -> None:
    assert runtime_federation_balancing_engine_v5_stub("p")["performance_score"] > 0
