"""runtime_adoption_readiness modules."""
from __future__ import annotations

import importlib

import pytest

_PKG = "app.runtime.runtime_adoption_readiness"
_MODULES = [
    "runtime_adoption_engine_v1",
    "runtime_customer_readiness_v1",
    "runtime_enterprise_readiness_v3",
    "runtime_public_adoption_v1",
    "runtime_operational_adoption_v1",
    "runtime_sdk_adoption_v1",
    "runtime_deployment_adoption_v1",
    "runtime_supportability_adoption_v1",
    "runtime_scalability_adoption_v1",
    "runtime_adoption_summary_v1",
]


@pytest.mark.parametrize("name", _MODULES)
def test_adopt_stub(name: str) -> None:
    mod = importlib.import_module(f"{_PKG}.{name}")
    stub = getattr(mod, f"{name}_stub")
    r = stub(f"adopt-{name}")
    assert r["integrity_status"] == "ok"
    assert float(r["runtime_confidence"]) > 0
