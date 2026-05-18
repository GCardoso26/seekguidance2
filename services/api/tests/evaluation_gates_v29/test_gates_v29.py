"""gates v29."""
import importlib

import pytest

_GATES = [
    "governance_traceability_gate_v29",
    "causal_reasoning_gate_v29",
    "operational_supervision_gate_v29",
    "safety_propagation_gate_v29",
    "constitutional_governance_gate_v29",
]


@pytest.mark.parametrize("gate", _GATES)
def test_gate_v29(gate: str) -> None:
    mod = importlib.import_module(f"evaluation.runtime_execution.{gate}")
    assert getattr(mod, f"{gate}_stub")("g29")["gate_passed"]
