"""gates v23."""
import importlib

import pytest

_GATES = [
    "os_convergence_gate_v23",
    "mesh_stability_gate_v23",
    "longitudinal_gate_v23",
    "sustainability_pressure_gate_v23",
    "deployment_stabilization_gate_v23",
]


@pytest.mark.parametrize("gate", _GATES)
def test_gate_v23(gate: str) -> None:
    mod = importlib.import_module(f"evaluation.runtime_execution.{gate}")
    assert getattr(mod, f"{gate}_stub")("g23")["gate_passed"] is True
