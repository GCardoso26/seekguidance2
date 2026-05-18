"""evaluation gates v20."""
from __future__ import annotations

import importlib

import pytest

_GATES = [
    "convergence_gate_v20",
    "sustainability_gate_v20",
    "longrun_gate_v20",
    "ecosystem_ops_gate_v20",
    "release_sustainability_gate_v20",
]


@pytest.mark.parametrize("gate", _GATES)
def test_gate_v20_stub(gate: str) -> None:
    mod = importlib.import_module(f"evaluation.runtime_execution.{gate}")
    stub = getattr(mod, f"{gate}_stub")
    r = stub("gate20")
    assert r["gate_passed"] is True
    assert r["integrity_status"] == "ok"
