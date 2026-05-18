"""gates v28."""
import importlib

import pytest

_GATES = [
    "civilization_coordination_gate_v28",
    "meta_stability_gate_v28",
    "entropy_reduction_gate_v28",
    "ecosystem_diplomacy_gate_v28",
    "governance_civilization_gate_v28",
]


@pytest.mark.parametrize("gate", _GATES)
def test_gate_v28(gate: str) -> None:
    mod = importlib.import_module(f"evaluation.runtime_execution.{gate}")
    assert getattr(mod, f"{gate}_stub")("g28")["gate_passed"]
