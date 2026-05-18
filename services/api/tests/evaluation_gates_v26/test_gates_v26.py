"""gates v26."""
import importlib

import pytest

_GATES = [
    "cognitive_convergence_gate_v26",
    "adaptive_coordination_gate_v26",
    "resilience_propagation_gate_v26",
    "governance_harmonization_gate_v26",
    "operational_forecasting_gate_v26",
]


@pytest.mark.parametrize("gate", _GATES)
def test_gate_v26(gate: str) -> None:
    mod = importlib.import_module(f"evaluation.runtime_execution.{gate}")
    assert getattr(mod, f"{gate}_stub")("g26")["gate_passed"]
