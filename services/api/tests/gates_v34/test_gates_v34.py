import importlib

import pytest

GATES = [
    "minimal_runtime_api_gate_v34_stub",
    "real_auth_gate_v34_stub",
    "real_replay_gate_v34_stub",
    "real_observability_gate_v34_stub",
    "real_deployment_gate_v34_stub",
    "real_tenant_gate_v34_stub",
    "minimal_federation_gate_v34_stub",
    "real_pilot_gate_v34_stub",
    "operational_continuity_gate_v34_stub",
    "productization_gate_v34_stub",
]


@pytest.mark.parametrize("fn", GATES)
def test_gates_v34(fn: str) -> None:
    mod = importlib.import_module("app.evaluation.gates.v34")
    out = getattr(mod, fn)("run-v34")
    assert out["gate_passed"] is True
    assert out["integrity_status"] == "ok"
