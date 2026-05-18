"""gates v30."""
import importlib

import pytest

_GATES = [
    "institutional_governance_gate_v30",
    "operational_memory_gate_v30",
    "resilience_survivability_gate_v30",
    "executive_oversight_gate_v30",
    "structural_governance_gate_v30",
]


@pytest.mark.parametrize("gate", _GATES)
def test_gate_v30(gate: str) -> None:
    mod = importlib.import_module(f"evaluation.runtime_execution.{gate}")
    assert getattr(mod, f"{gate}_stub")("g30")["gate_passed"]
