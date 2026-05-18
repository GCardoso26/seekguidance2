"""gates v25."""
import importlib

import pytest

_GATES = [
    "topology_cognition_gate_v25",
    "autonomous_balancing_gate_v25",
    "stewardship_longevity_gate_v25",
    "healing_convergence_gate_v25",
    "governance_mesh_gate_v25",
]


@pytest.mark.parametrize("gate", _GATES)
def test_gate_v25(gate: str) -> None:
    mod = importlib.import_module(f"evaluation.runtime_execution.{gate}")
    assert getattr(mod, f"{gate}_stub")("g25")["gate_passed"]
