"""gates v24."""
import importlib

import pytest

_GATES = [
    "governance_entropy_gate_v24",
    "federation_imbalance_gate_v24",
    "self_healing_gate_v24",
    "long_horizon_gate_v24",
    "ecosystem_maturity_gate_v24",
]


@pytest.mark.parametrize("gate", _GATES)
def test_gate_v24(gate: str) -> None:
    mod = importlib.import_module(f"evaluation.runtime_execution.{gate}")
    assert getattr(mod, f"{gate}_stub")("g24")["gate_passed"]
