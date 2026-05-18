"""gates v22."""
import importlib

import pytest

_GATES = [
    "autonomy_gate_v22",
    "continuous_cert_gate_v22",
    "global_ecosystem_gate_v22",
    "sustainability_intel_gate_v22",
    "platform_economics_gate_v22",
]


@pytest.mark.parametrize("gate", _GATES)
def test_gate_v22(gate: str) -> None:
    mod = importlib.import_module(f"evaluation.runtime_execution.{gate}")
    r = getattr(mod, f"{gate}_stub")("g22")
    assert r["gate_passed"] is True
