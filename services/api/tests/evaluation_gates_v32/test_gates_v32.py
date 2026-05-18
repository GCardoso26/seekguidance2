"""gates v32."""
import importlib

import pytest

_GATES = [
    "institutional_continuity_gate_v32",
    "predictive_intelligence_gate_v32",
    "constitutional_evolution_gate_v32",
    "survivability_network_gate_v32",
    "public_institutional_continuity_gate_v32",
]


@pytest.mark.parametrize("gate", _GATES)
def test_gate_v32(gate: str) -> None:
    mod = importlib.import_module(f"evaluation.runtime_execution.{gate}")
    assert getattr(mod, f"{gate}_stub")("g32")["gate_passed"]
