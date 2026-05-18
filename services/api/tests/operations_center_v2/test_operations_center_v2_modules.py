"""operations_center_v2."""
from __future__ import annotations

import importlib

import pytest

_PKG = "app.runtime.platform_operations_center"
_MODULES = [
    "operations_center_runtime_v2",
    "operations_executive_health_v2",
    "operations_federation_view_v2",
    "operations_rollout_visibility_v2",
    "operations_governance_visibility_v2",
    "operations_sustainability_visibility_v2",
    "operations_certification_visibility_v2",
    "operations_ecosystem_maturity_v2",
    "operations_deployment_lifecycle_v2",
    "operations_incident_coordination_v2",
]


@pytest.mark.parametrize("name", _MODULES)
def test_opc2_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    fn = getattr(mod, f"{name}_stub", None)
    if fn is None and name.endswith("_engine_v1"):
        fn = getattr(mod, name)
    elif fn is None:
        fn = getattr(mod, f"{name}_stub")
    r = fn(f"opc2-{name}")
    assert r["integrity_status"] == "ok"
    assert float(r["runtime_confidence"]) > 0
