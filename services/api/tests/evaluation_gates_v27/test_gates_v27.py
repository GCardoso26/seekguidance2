"""gates v27."""
import importlib

import pytest

_GATES = [
    "adaptive_civilization_gate_v27",
    "operational_consensus_gate_v27",
    "ecosystem_convergence_gate_v27",
    "resilience_evolution_gate_v27",
    "governance_evolution_gate_v27",
]


@pytest.mark.parametrize("gate", _GATES)
def test_gate_v27(gate: str) -> None:
    mod = importlib.import_module(f"evaluation.runtime_execution.{gate}")
    assert getattr(mod, f"{gate}_stub")("g27")["gate_passed"]
