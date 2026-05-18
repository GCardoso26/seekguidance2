"""gates v21."""
from __future__ import annotations

import importlib

import pytest

_GATES = [
    "stewardship_gate_v21",
    "multiversion_gate_v21",
    "ecosystem_governance_gate_v21",
    "longitudinal_gate_v21",
    "adoption_gate_v21",
]


@pytest.mark.parametrize("gate", _GATES)
def test_gate_v21_stub(gate: str) -> None:
    mod = importlib.import_module(f"evaluation.runtime_execution.{gate}")
    r = getattr(mod, f"{gate}_stub")("g21")
    assert r["gate_passed"] is True
