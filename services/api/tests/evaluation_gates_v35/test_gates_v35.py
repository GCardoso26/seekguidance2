import importlib

import pytest

GATES = [
    "deployment_v2_gate_v35_stub",
    "observability_v2_gate_v35_stub",
    "persistence_gate_v35_stub",
    "backup_gate_v35_stub",
    "onboarding_gate_v35_stub",
    "pilot_v2_gate_v35_stub",
    "incident_collection_gate_v35_stub",
    "support_operations_gate_v35_stub",
    "usage_analytics_gate_v35_stub",
    "operational_ux_gate_v35_stub",
]


@pytest.mark.parametrize("fn", GATES)
def test_gates_v35(fn: str) -> None:
    mod = importlib.import_module("app.evaluation.gates.v35")
    assert getattr(mod, fn)("r")["gate_passed"] is True
